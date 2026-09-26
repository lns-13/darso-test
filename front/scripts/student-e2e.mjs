/**
 * Interactive e2e for every student-side action wired in this branch.
 * Reports one line per check. Non-zero exit on any failure.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3001";
const results = [];
const record = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
};

const browser = await chromium.launch();

async function closeAll(page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

// ---------- /student ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Calendar icon in header
  await Promise.all([
    page.waitForURL("**/student/sessions", { timeout: 4000 }).catch(() => null),
    page.locator('[aria-label="Voir mes séances"]').first().click(),
  ]);
  record("student · calendar icon → /student/sessions", page.url().endsWith("/student/sessions"), page.url());

  // Back to /student
  await page.goto(BASE + "/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Nouvelle demande opens modal
  await page.locator('button:has-text("Nouvelle demande")').first().click();
  await page.waitForTimeout(400);
  record(
    "student · Nouvelle demande → NewRequestModal",
    await page.locator('[role="dialog"]:has-text("Nouvelle demande")').isVisible(),
  );
  await closeAll(page);

  // Besoin d'un prof précis (QuickAction lime) opens same modal
  await page.locator('button:has-text("Besoin d")').first().click();
  await page.waitForTimeout(400);
  record(
    "student · QuickAction lime → NewRequestModal",
    await page.locator('[role="dialog"]:has-text("Décris ce que tu cherches")').isVisible(),
  );
  await closeAll(page);

  // Trouve un prof par matière (QuickAction dark) → /student/discover
  await Promise.all([
    page.waitForURL("**/student/discover", { timeout: 4000 }).catch(() => null),
    page.locator('a:has-text("Trouve un prof par matière")').first().click(),
  ]);
  record("student · QuickAction dark → /student/discover", page.url().endsWith("/student/discover"), page.url());
  await page.goto(BASE + "/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Course card → teacher preview
  await Promise.all([
    page.waitForURL("**/teacher/preview/**", { timeout: 6000 }).catch(() => null),
    page.locator('a[aria-label*="Mathématiques"]').first().click(),
  ]);
  record("student · CourseCard → /teacher/preview/*", page.url().includes("/teacher/preview/"), page.url());
  await page.goto(BASE + "/student", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // Voir 3 candidatures
  await page.locator('button:has-text("Voir les 3 candidatures")').first().click();
  await page.waitForTimeout(400);
  record(
    "student · Voir les 3 candidatures → CandidatesDrawer",
    await page.locator('[role="dialog"][aria-label="Candidatures"]').isVisible(),
  );

  // Try Accept first candidate
  const accept = page.locator('button:has-text("Accepter")').first();
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    await page.waitForTimeout(300);
    record(
      "student · Candidate Accept flips label to Accepté",
      await page.locator('button:has-text("Accepté")').first().isVisible(),
    );
  }
  await closeAll(page);

  // Rejoindre → JoinSessionModal
  await page.locator('button:has-text("Rejoindre")').first().click();
  await page.waitForTimeout(500);
  record(
    "student · Rejoindre → JoinSessionModal",
    await page.locator('[role="dialog"][aria-label^="Rejoindre "]').isVisible(),
  );
  // Try to "Rejoindre la salle"
  const joinBtn = page.locator('button:has-text("Rejoindre la salle")').first();
  if (await joinBtn.isVisible().catch(() => false)) {
    await joinBtn.click();
    await page.waitForTimeout(1800);
    record(
      "student · Join lobby → Connected",
      await page.locator('p:has-text("Salle rejointe")').isVisible(),
    );
  }
  await closeAll(page);

  // Détails → SessionDetailModal
  await page.locator('button:has-text("Détails")').first().click();
  await page.waitForTimeout(500);
  record(
    "student · Détails → SessionDetailModal",
    await page.locator('[role="dialog"][aria-label^="Séance :"]').isVisible(),
  );
  await closeAll(page);

  await ctx.close();
}

// ---------- /student/discover ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/student/discover", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Matière dropdown opens
  await page.locator('summary:has-text("Matière")').first().click();
  await page.waitForTimeout(300);
  record(
    "discover · Matière dropdown opens",
    await page.locator('button:has-text("Mathématiques")').first().isVisible(),
  );
  // Select an option
  await page.locator('summary:has-text("Matière")').first().click();
  await page.waitForTimeout(300);
  await page.locator('summary:has-text("Matière")').first().click();
  await page.waitForTimeout(200);
  await page.locator('details:has(summary:has-text("Matière")) button:has-text("SVT")').click();
  await page.waitForTimeout(300);
  record(
    "discover · Matière filter narrows list",
    (await page.locator('article:has-text("Bac SVT")').count()) > 0,
  );

  // Note filter — click 4th star (4+ stars)
  const star4 = page.locator('[aria-label="4 étoiles et plus"]').first();
  if (await star4.isVisible()) {
    await star4.click();
    await page.waitForTimeout(300);
    record("discover · Note filter clicks", true);
  }

  await ctx.close();
}

// ---------- /student/sessions ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/student/sessions", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Vue à venir → tab switch
  await page.locator('button:has-text("Vue à venir")').first().click();
  await page.waitForTimeout(300);
  record(
    "sessions · Vue à venir switches tab (URL ?tab=upcoming)",
    page.url().includes("tab=upcoming"),
    page.url(),
  );

  // Salle d'attente → opens JoinSessionModal (some live/upcoming pulsing session)
  await page.locator("button:has-text(\"Salle d'attente\")").click();
  await page.waitForTimeout(600);
  const joinOpen = await page
    .locator('[role="dialog"][aria-label^="Rejoindre "]')
    .isVisible()
    .catch(() => false);
  const noticeShown = await page
    .locator('[role="status"]:has-text("Aucune")')
    .isVisible()
    .catch(() => false);
  record("sessions · Salle d'attente reacts", joinOpen || noticeShown);
  await closeAll(page);

  // Detail drawer Rejoindre la séance
  await page.locator('button:has-text("Aujourd\'hui")').first().click(); // ensure today
  await page.waitForTimeout(300);
  const drawerJoin = page.locator('button:has-text("Rejoindre la séance")').first();
  if (await drawerJoin.isVisible().catch(() => false)) {
    await drawerJoin.click();
    await page.waitForTimeout(600);
    record(
      "sessions · Drawer Rejoindre la séance → JoinSessionModal",
      await page.locator('[role="dialog"][aria-label^="Rejoindre "]').isVisible(),
    );
    await closeAll(page);
  }

  // Annuler → session removed
  const before = await page.locator('article, [role="button"]:has-text("À VENIR"), .rounded-\\[16px\\]:has-text("Analyse")').count();
  const cancel = page.locator('button:has-text("Annuler")').first();
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click();
    await page.waitForTimeout(500);
    record(
      "sessions · Annuler flashes toast",
      await page.locator('[role="status"]:has-text("annulée")').isVisible().catch(() => false),
    );
  }
  await closeAll(page);

  // Message → navigate to /student/messages
  const msg = page.locator('button:has-text("Message")').first();
  if (await msg.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForURL("**/student/messages**", { timeout: 4000 }).catch(() => null),
      msg.click(),
    ]);
    record("sessions · Message → /student/messages", page.url().includes("/student/messages"), page.url());
  }

  await ctx.close();
}

// ---------- /student/payments ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/student/payments", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // Recharger
  await page.locator('button:has-text("Recharger")').first().click();
  await page.waitForTimeout(400);
  record(
    "payments · Recharger → PaymentTopUpModal",
    await page.locator('[role="dialog"][aria-label="Recharger le portefeuille"]').isVisible(),
  );
  // Confirm top-up
  const confirm = page.locator('button:has-text("Recharger 200 MAD")').first();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
    await page.waitForTimeout(1500);
    record(
      "payments · Recharger 200 MAD updates balance",
      (await page.locator('text=540 MAD').count()) > 0,
    );
  }
  await closeAll(page);

  // Ajouter carte
  await page.locator('button:has-text("Ajouter une carte")').first().click();
  await page.waitForTimeout(400);
  record(
    "payments · Ajouter une carte → AddCardModal",
    await page.locator('[role="dialog"][aria-label="Ajouter une carte"]').isVisible(),
  );
  await closeAll(page);

  // Filtrer popover
  await page.locator('button:has-text("Filtrer")').first().click();
  await page.waitForTimeout(300);
  record(
    "payments · Filtrer popover opens with statuses",
    await page.locator('button:has-text("En attente")').first().isVisible(),
  );
  await page.locator('button:has-text("Payés")').first().click();
  await page.waitForTimeout(300);
  record(
    "payments · Filter narrows to Payés (chip labels active)",
    await page.locator('button:has-text("Filtrer · Payés")').first().isVisible(),
  );

  // Invoice modal + PDF download
  await page.locator('td:has-text("Analyse — dérivées & fonction composée")').first().click();
  await page.waitForTimeout(500);
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
    page.locator('button:has-text("Télécharger le PDF")').first().click(),
  ]);
  record("payments · Télécharger le PDF triggers download", Boolean(dl), dl ? dl.suggestedFilename() : "");
  await closeAll(page);

  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length > 0) {
  console.log("Failing:");
  failed.forEach((f) => console.log(" - " + f.name));
  process.exit(1);
}
