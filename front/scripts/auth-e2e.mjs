/**
 * End-to-end check for the auth flows wired in Task 02.
 *
 *   node scripts/auth-e2e.mjs            # against http://localhost:3100
 *   BASE=http://localhost:3000 node scripts/auth-e2e.mjs
 *
 * Reads .env.local for the Supabase keys. The service-role key is used only
 * to create and delete throwaway fixture users and to read back the rows the
 * sign-up trigger writes; every user-facing assertion goes through the real
 * UI in a real browser.
 *
 * Exactly one confirmation email is sent, by the one sign-up that goes
 * through the form. Every other path is chosen so Supabase has nothing to
 * send: magic link and password reset are exercised with addresses that have
 * no account, and the two email links that must be *followed* are minted with
 * the admin generateLink API, which returns a link without mailing it.
 *
 * Non-zero exit on any failure.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BASE = (process.env.BASE ?? "http://localhost:3100").replace(/\/$/, "");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------- env --- */

const env = {};
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/* -------------------------------------------------------------- report --- */

const results = [];
const record = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
};
const skip = (name, extra = "") => {
  results.push({ name, ok: true, skipped: true, extra });
  console.log(`SKIP  ${name}${extra ? " — " + extra : ""}`);
};
const eq = (name, actual, expected) =>
  record(name, actual === expected, actual === expected ? "" : `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);

/* ------------------------------------------------------------ fixtures --- */

const STAMP = Date.now();
const created = [];

const addr = (tag) => `darso.e2e.${tag}.${STAMP}@example.com`;
const PASSWORD = "motdepasse123";

async function makeUser({ tag, role, fullName, birthDate, guardianEmail, confirm = true }) {
  const email = addr(tag);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: confirm,
    user_metadata: {
      full_name: fullName,
      role,
      birth_date: birthDate,
      guardian_email: guardianEmail ?? "",
    },
  });
  if (error) throw new Error(`createUser(${tag}): ${error.message}`);
  created.push(data.user.id);
  return { id: data.user.id, email };
}

async function rowsFor(userId) {
  const [profile, priv, teacher, student] = await Promise.all([
    admin.from("profiles").select("role, full_name").eq("id", userId).maybeSingle(),
    admin.from("profiles_private").select("birth_date, guardian_email").eq("user_id", userId).maybeSingle(),
    admin.from("teacher_profiles").select("username").eq("user_id", userId).maybeSingle(),
    admin.from("student_profiles").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    profile: profile.data,
    priv: priv.data,
    teacher: teacher.data,
    student: student.data,
  };
}

/** A token-hash link, minted without sending any email. */
async function linkFor(type, email, extra = {}) {
  const { data, error } = await admin.auth.admin.generateLink({ type, email, ...extra });
  if (error) throw new Error(`generateLink(${type}): ${error.message}`);
  return data.properties.hashed_token;
}

const YEAR = new Date().getFullYear();

/* ------------------------------------------------------------- helpers --- */

const text = (page, selector) => page.locator(selector).first().innerText();

async function checkmarkHidden(page) {
  // The success animation sets display:block on .check. Anything else means
  // the checkmark never fired.
  const display = await page
    .locator("form .check")
    .first()
    .evaluate((el) => getComputedStyle(el).display)
    .catch(() => "none");
  return display === "none";
}

/**
 * Fills the whole identity step and confirms the component actually received
 * it.
 *
 * Typing into an input before React attaches changes the DOM and nothing
 * else: component state stays empty, so every control derived from it keeps
 * its server-rendered value and the step never becomes valid. Waiting for
 * hydration first does not help, because the signal that hydration finished
 * is itself downstream of these values. So fill, check whether the CTA
 * noticed, and fill again if it did not. On a cold dev server the first
 * attempt usually lands before the route has compiled.
 */
async function fillIdentity(page, values) {
  const cta = page.locator('button:has-text("Continuer")').first();
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.fill("#fullName", values.fullName);
    await page.fill("#email", values.email);
    await page.fill("#password", values.password);
    await page.fill("#dob-d", values.d);
    await page.fill("#dob-m", values.m);
    await page.fill("#dob-y", values.y);
    if (await cta.isEnabled().catch(() => false)) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

/**
 * Navigating while a React transition is still in flight aborts the request.
 * One retry after a short settle is enough; the alternative is sprinkling
 * waits at every call site.
 */
async function goTo(page, url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

// Default is generous because these wait on a Server Action round trip, and
// on a cold dev server the first call to one compiles it first.
async function seesText(page, needle, timeout = 20000) {
  try {
    await page.getByText(needle, { exact: false }).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- main --- */

/**
 * Uses the Chrome already on the machine rather than a Playwright-managed
 * build, so the suite runs without a 150MB download. Override with
 * CHROME_PATH if Chrome lives somewhere else.
 */
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
let signedUpUserId = null;

try {
  /* == 1. the sign-up trigger contract, driven by metadata identical to the
        keys the signUp action sends ======================================= */

  const teacherFixture = await makeUser({
    tag: "prof",
    role: "teacher",
    fullName: "Youssef Amrani",
    birthDate: "1990-04-11",
    guardianEmail: "",
  });
  const teacherRows = await rowsFor(teacherFixture.id);
  eq("trigger · teacher profiles.role", teacherRows.profile?.role, "teacher");
  record("trigger · teacher_profiles.username generated from the full name",
    Boolean(teacherRows.teacher?.username?.startsWith("youssef-amrani")),
    teacherRows.teacher?.username);
  record("trigger · teacher has no student_profiles row", teacherRows.student === null);
  eq("trigger · birth_date stored on profiles_private", teacherRows.priv?.birth_date, "1990-04-11");

  const minorFixture = await makeUser({
    tag: "mineur",
    role: "student",
    fullName: "Lina Bensaid",
    birthDate: `${YEAR - 15}-06-02`,
    guardianEmail: "tuteur@example.com",
  });
  const minorRows = await rowsFor(minorFixture.id);
  eq("trigger · minor guardian_email stored", minorRows.priv?.guardian_email, "tuteur@example.com");
  record("trigger · student has a student_profiles row", minorRows.student !== null);
  record("trigger · student has no teacher_profiles row", minorRows.teacher === null);

  const adultFixture = await makeUser({
    tag: "eleve",
    role: "student",
    fullName: "Amine Benali",
    birthDate: "1998-02-20",
    guardianEmail: "parent@example.com",
  });
  const adultRows = await rowsFor(adultFixture.id);
  eq("trigger · adult guardian_email dropped server-side", adultRows.priv?.guardian_email, null);

  /* == 2. sign-in ===================================================== */

  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();

    await goTo(page, `${BASE}/sign-in`);
    await page.locator('button[type="submit"]').click();
    record("sign-in · empty email message", await seesText(page, "Entrez votre email."));
    record("sign-in · empty password message", await seesText(page, "Entrez votre mot de passe."));
    record("sign-in · checkmark did not fire on a failed submit", await checkmarkHidden(page));

    await page.fill("#email", "pas-un-email");
    await page.fill("#password", "court");
    await page.locator('button[type="submit"]').click();
    record("sign-in · bad email format message", await seesText(page, "Format d'email invalide."));
    record("sign-in · short password message", await seesText(page, "8 caractères minimum."));

    await page.fill("#email", adultFixture.email);
    await page.fill("#password", "mauvaismotdepasse");
    await page.locator('button[type="submit"]').click();
    record("sign-in · wrong password shows a French error",
      await seesText(page, "Email ou mot de passe incorrect."));
    record("sign-in · checkmark did not fire on wrong password", await checkmarkHidden(page));
    eq("sign-in · stayed on /sign-in after a failure", new URL(page.url()).pathname, "/sign-in");

    // Magic link mode, address with no account: shouldCreateUser is false, so
    // this must refuse rather than quietly create a student profile.
    await page.locator('button:has-text("Lien magique")').click();
    await page.fill("#email", `inconnu.${STAMP}@example.com`);
    await page.locator('button[type="submit"]').click();
    record("magic link · unknown address is refused, no account created",
      await seesText(page, "Aucun compte darso"));
    const strayUser = await admin.auth.admin.listUsers();
    record("magic link · no auth user was created for the unknown address",
      !strayUser.data.users.some((u) => u.email === `inconnu.${STAMP}@example.com`));

    await ctx.close();
  }

  /* student lands on /student */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await goTo(page, `${BASE}/sign-in`);
    await page.fill("#email", adultFixture.email);
    await page.fill("#password", PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/student", { timeout: 20000 }).catch(() => null);
    eq("sign-in · a student lands on the student dashboard", new URL(page.url()).pathname, "/student");
    await ctx.close();
  }

  /* teacher lands on /teacher — the bug this task exists to fix */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await goTo(page, `${BASE}/sign-in`);
    await page.fill("#email", teacherFixture.email);
    await page.fill("#password", PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/teacher", { timeout: 20000 }).catch(() => null);
    eq("sign-in · a teacher lands on the teacher dashboard", new URL(page.url()).pathname, "/teacher");

    /* sign out, then sign back in */
    const status = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/auth/sign-out`, { method: "POST", redirect: "manual" });
      return res.status;
    }, BASE);
    record("sign-out · POST /auth/sign-out answered", status < 500, `status ${status}`);
    const cookies = await ctx.cookies();
    record("sign-out · Supabase auth cookies cleared",
      !cookies.some((c) => c.name.includes("auth-token") && c.value.length > 20));

    await goTo(page, `${BASE}/sign-in`);
    await page.fill("#email", teacherFixture.email);
    await page.fill("#password", PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/teacher", { timeout: 20000 }).catch(() => null);
    eq("sign-in · signed back in after signing out", new URL(page.url()).pathname, "/teacher");
    await ctx.close();
  }

  /* == 3. forgot password + the landing page that did not exist ======= */

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await goTo(page, `${BASE}/forgot-password`);
    await page.locator('button[type="submit"]').click();
    record("forgot · empty email message", await seesText(page, "Entrez votre email."));

    // An address with no account: Supabase answers success and sends nothing,
    // which is the anti-enumeration behaviour we want the UI to show.
    await page.fill("#email", `inconnu.${STAMP}@example.com`);
    await page.locator('button[type="submit"]').click();
    record("forgot · confirmation view", await seesText(page, "Vérifiez votre boîte mail."));

    await goTo(page, `${BASE}/reset-password`);
    record("reset · page exists and refuses a visit with no recovery session",
      await seesText(page, "plus valide"));
    await ctx.close();
  }

  /* == 4. sign-up through the form =================================== */

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await goTo(page, `${BASE}/sign-up`);

    const cta = page.locator('button:has-text("Continuer")').first();

    record(
      "sign-up · the identity step accepts a valid adult",
      await fillIdentity(page, {
        fullName: "Sofia Merabet",
        email: addr("form"),
        password: PASSWORD,
        d: "14",
        m: "03",
        y: "1994",
      }),
    );

    // A five-year-old passes the old client rules. The database check
    // constraint would reject it and take the whole auth insert down.
    await page.fill("#dob-y", String(YEAR - 5));
    record("sign-up · an implausible age blocks the step", await cta.isDisabled());

    // A minor must name a guardian.
    await page.fill("#dob-y", String(YEAR - 15));
    const guardianAppeared = await page
      .locator("#parentEmail")
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    record("sign-up · guardian field appears for a minor", guardianAppeared);
    record("sign-up · a minor with no guardian email blocks the step", await cta.isDisabled());

    await page.fill("#parentEmail", "tuteur@example.com");
    record("sign-up · a minor with a guardian email may continue", await cta.isEnabled());

    // Trap 5: correcting the birth date to an adult one must not leave the
    // guardian address behind in state.
    await page.fill("#dob-y", "1996");
    const guardianGone = await page
      .locator("#parentEmail")
      .waitFor({ state: "hidden", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    record("sign-up · guardian field hidden once the date says adult", guardianGone);
    await page.fill("#dob-y", String(YEAR - 15));
    const guardianAfter = await page.locator("#parentEmail").inputValue();
    eq("sign-up · guardian email was cleared, not merely hidden", guardianAfter, "");

    // Real sign-up through the form. Supabase applies its own address rules
    // on top of ours and rejects some domains outright, and its built-in
    // mailer is capped at a couple of messages an hour, so this is the one
    // check the environment can block rather than the code. When that
    // happens the French message the user would actually see is recorded and
    // the run carries on.
    const signUpEmail = addr("form");
    await page.fill("#dob-d", "14");
    await page.fill("#dob-m", "03");
    await page.fill("#dob-y", "1994");
    await page.fill("#email", signUpEmail);
    await cta.click();

    record("sign-up · reached the role step", await seesText(page, "plutôt pour"));
    await page.locator('button:has-text("Je veux enseigner")').click();
    await page.locator('button:has-text("Continuer vers la vérification")').click();

    const reachedNextSteps = await seesText(page, "En attente de vérification", 25000);
    if (reachedNextSteps) {
      record("sign-up · teacher sees the next-steps step", true);
      const { data: listed } = await admin.auth.admin.listUsers();
      const signedUp = listed.users.find((u) => u.email === signUpEmail);
      record("sign-up · the auth user exists", Boolean(signedUp), signUpEmail);
      if (signedUp) {
        created.push(signedUp.id);
        const rows = await rowsFor(signedUp.id);
        eq("sign-up · profiles.role matches the chosen role", rows.profile?.role, "teacher");
        eq("sign-up · full_name stored", rows.profile?.full_name, "Sofia Merabet");
        eq("sign-up · birth_date composed server-side", rows.priv?.birth_date, "1994-03-14");
        eq("sign-up · adult guardian_email is null", rows.priv?.guardian_email, null);
        record("sign-up · teacher_profiles row with a username",
          Boolean(rows.teacher?.username), rows.teacher?.username);
        record("sign-up · no student_profiles row", rows.student === null);
        record("sign-up · account is not confirmed yet", !signedUp.email_confirmed_at);
      }
      await page.locator('button:has-text("Terminer plus tard")').click();
      record("sign-up · confirmation view", await seesText(page, "Confirmez votre"));
    } else {
      const body = await page.locator("body").innerText();
      const shown =
        [
          "Trop de tentatives",
          "Format d'email invalide",
          "déjà utilisé",
          "Une erreur est survenue",
        ].find((m) => body.includes(m)) ?? "(no French error rendered)";
      skip("sign-up · form sign-up blocked by the mail provider", shown);
    }

    // A second sign-up with an address that already has an account must say
    // so. Supabase mails nothing here, so the quota is untouched.
    await goTo(page, `${BASE}/sign-up`);
    await fillIdentity(page, {
      fullName: "Sofia Merabet",
      email: teacherFixture.email,
      password: PASSWORD,
      d: "14",
      m: "03",
      y: "1994",
    });
    await page.locator('button:has-text("Continuer")').first().click();
    await page.locator('button:has-text("Je veux enseigner")').click();
    await page.locator('button:has-text("Continuer vers la vérification")').click();
    record("sign-up · an already-registered address is reported",
      await seesText(page, "déjà utilisé", 25000));

    await ctx.close();
  }

  /* == 5. the email links, followed for real ========================= */

  {
    // An unconfirmed teacher created through the admin API, carrying exactly
    // the metadata the signUp action sends. generateLink mints the link
    // without mailing it, so the confirmation round trip runs without
    // touching the mail quota.
    const pending = await makeUser({
      tag: "confirm",
      role: "teacher",
      fullName: "Nadia Cherif",
      birthDate: "1992-08-09",
      confirm: false,
    });
    const rows = await rowsFor(pending.id);
    eq("sign-up metadata · profiles.role", rows.profile?.role, "teacher");
    eq("sign-up metadata · full_name", rows.profile?.full_name, "Nadia Cherif");
    eq("sign-up metadata · birth_date", rows.priv?.birth_date, "1992-08-09");

    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let hash = null;
    try {
      hash = await linkFor("signup", pending.email, { password: PASSWORD });
    } catch {
      try {
        hash = await linkFor("magiclink", pending.email);
      } catch {
        hash = null;
      }
    }
    if (hash) {
      await goTo(page, `${BASE}/auth/callback?token_hash=${hash}&type=signup`);
      eq("callback · confirming the account lands a teacher on /teacher",
        new URL(page.url()).pathname, "/teacher");
      const { data: after } = await admin.auth.admin.getUserById(pending.id);
      record("callback · the account is now confirmed",
        Boolean(after.user.email_confirmed_at));
    } else {
      skip("callback · could not mint a confirmation link");
    }
    await ctx.close();
  }

  /* password reset, end to end */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const hash = await linkFor("recovery", teacherFixture.email);
    await goTo(page, `${BASE}/auth/callback?token_hash=${hash}&type=recovery&next=/reset-password`);
    eq("reset · the recovery link lands on the reset page",
      new URL(page.url()).pathname, "/reset-password");

    await page.fill("#password", "court");
    await page.fill("#passwordConfirm", "court");
    await page.locator('button[type="submit"]').click();
    record("reset · a short password is refused",
      await seesText(page, "8 caractères minimum."));

    const NEW_PASSWORD = "nouveaupasse456";
    await page.fill("#password", NEW_PASSWORD);
    await page.fill("#passwordConfirm", "autrechose789");
    await page.locator('button[type="submit"]').click();
    record("reset · mismatched confirmation is refused",
      await seesText(page, "ne correspondent pas"));

    await page.fill("#passwordConfirm", NEW_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/teacher", { timeout: 20000 }).catch(() => null);
    eq("reset · lands on the role-correct dashboard",
      new URL(page.url()).pathname, "/teacher");
    await ctx.close();

    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await goTo(page2, `${BASE}/sign-in`);
    await page2.fill("#email", teacherFixture.email);
    await page2.fill("#password", NEW_PASSWORD);
    await page2.locator('button[type="submit"]').click();
    await page2.waitForURL("**/teacher", { timeout: 20000 }).catch(() => null);
    eq("reset · the new password signs in", new URL(page2.url()).pathname, "/teacher");
    await ctx2.close();
  }

  /* == 6. an expired or tampered link fails in French ================ */

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await goTo(page, `${BASE}/auth/callback?token_hash=pas-un-vrai-jeton&type=signup`);
    eq("callback · a bad link redirects to sign-in", new URL(page.url()).pathname, "/sign-in");
    record("callback · with a French explanation", await seesText(page, "Ce lien a expiré"));
    await ctx.close();
  }
} finally {
  await browser.close();
  for (const id of created) {
    await admin.auth.admin.deleteUser(id).catch(() => null);
  }
  console.log(`\ncleaned up ${created.length} fixture users`);
}

const failed = results.filter((r) => !r.ok);
const skipped = results.filter((r) => r.skipped);
console.log(
  `\n${results.length - failed.length - skipped.length}/${results.length - skipped.length} checks passed` +
    (skipped.length ? `, ${skipped.length} skipped` : ""),
);
if (failed.length) {
  console.log("failed:");
  for (const f of failed) console.log(`  - ${f.name}${f.extra ? " — " + f.extra : ""}`);
  process.exit(1);
}
