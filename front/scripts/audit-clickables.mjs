/**
 * Clickable-audit — Playwright walks every app route and reports:
 *   - DEAD  <button> elements (click does nothing observable)
 *   - 404   <a href> pointing to a missing local route
 *   - Console errors captured during load
 *
 * Emits ./audit-report.json and ./audit-report.md, exits non-zero on findings.
 * Usage:   node scripts/audit-clickables.mjs
 * Base:    env AUDIT_BASE (default http://localhost:3002)
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3002";

const ROUTES = [
  // Public
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  // Student
  "/student",
  "/student/discover",
  "/student/sessions",
  "/student/payments",
  "/student/messages",
  "/student/favorites",
  "/student/notifications",
  "/student/notifications/settings",
  "/student/help",
  "/student/help/dispute",
  "/student/help/contact",
  "/student/profile",
  "/student/reviews",
  // Teacher
  "/teacher",
  "/teacher/discover",
  "/teacher/sessions",
  "/teacher/earnings",
  "/teacher/stats",
  "/teacher/reviews",
  "/teacher/messages",
  "/teacher/verification",
  "/teacher/notifications",
  "/teacher/notifications/settings",
  "/teacher/help",
  "/teacher/help/dispute",
  "/teacher/help/contact",
  "/teacher/profile",
  "/teacher/agency",
  "/teacher/preview/youssef-amrani",
];

const IGNORE_TEXT = /^(fermer|close|réduire|déployer|ouvrir le menu|menu)$/i;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const results = [];
const checkedHrefs = new Map(); // href → status

async function head(page, url) {
  if (checkedHrefs.has(url)) return checkedHrefs.get(url);
  try {
    const resp = await page.request.get(url);
    checkedHrefs.set(url, resp.status());
    return resp.status();
  } catch {
    checkedHrefs.set(url, 0);
    return 0;
  }
}

for (const route of ROUTES) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("pageerror", (err) => pageErrors.push(String(err?.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter noisy expected messages (React dev warnings unrelated to interactivity)
      if (/DevTools|Download the React|Fast Refresh/i.test(text)) return;
      consoleErrors.push(text);
    }
  });

  const url = BASE + route;
  let loadStatus = 0;
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    loadStatus = resp?.status() ?? 0;
  } catch (err) {
    results.push({
      route,
      loadStatus: 0,
      loadError: String(err?.message || err),
      dead: [],
      broken: [],
      consoleErrors: [],
      pageErrors: [String(err?.message || err)],
    });
    await page.close();
    continue;
  }

  const dead = [];
  const broken = [];

  // 1. Link audit — collect internal hrefs
  const anchors = await page
    .$$eval(
      'a[href]',
      (els) =>
        els.map((el) => ({
          href: /** @type {HTMLAnchorElement} */ (el).getAttribute("href") || "",
          text: (el.textContent || "").trim().slice(0, 60),
          aria: el.getAttribute("aria-label") || "",
          html: el.outerHTML.slice(0, 200),
        })),
    )
    .catch(() => []);

  for (const a of anchors) {
    const href = a.href;
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      continue;
    if (/^https?:\/\//i.test(href)) continue; // external
    const targetUrl = new URL(href, url).toString();
    if (!targetUrl.startsWith(BASE)) continue;
    const status = await head(page, targetUrl);
    if (status >= 400 || status === 0) {
      broken.push({ href, status, text: a.text, aria: a.aria });
    }
  }

  // 2. Dead button detection — click each button-like element and see if
  //    anything observable happens (URL change, DOM mutation, or a modal
  //    with common role attributes appearing).
  const buttonHandles = await page.$$(
    'button, [role="button"]:not(button), [role="tab"]:not(a), [role="menuitem"]:not(a)',
  );

  for (const handle of buttonHandles) {
    // Skip disabled or ignored
    const meta = await handle
      .evaluate((el) => {
        const b = /** @type {HTMLButtonElement} */ (el);
        if (b.disabled) return null;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return null;
        // Skip elements inside a currently-closed <details> (dropdown options)
        const closedDetails = el.closest("details");
        if (closedDetails && !closedDetails.open && el.tagName !== "SUMMARY") {
          return null;
        }
        // Skip content that isn't actually visible/rendered
        // @ts-ignore modern method
        if (typeof el.checkVisibility === "function" && !el.checkVisibility()) {
          return null;
        }
        return {
          text: (el.textContent || "").trim().slice(0, 60),
          aria: el.getAttribute("aria-label") || "",
          type: el.getAttribute("type") || "",
          html: el.outerHTML.slice(0, 200),
          insideForm: !!el.closest("form"),
          hasHrefAncestor: !!el.closest("a[href]"),
          isSubmit: /** @type {HTMLButtonElement} */ (el).type === "submit",
        };
      })
      .catch(() => null);
    if (!meta) continue;
    if (meta.hasHrefAncestor) continue; // wrapped in link — will navigate
    if (meta.isSubmit || meta.insideForm) continue; // form-handler
    if (IGNORE_TEXT.test(meta.text) || IGNORE_TEXT.test(meta.aria)) continue;

    const urlBefore = page.url();

    // Install a MutationObserver on <body> + a scroll listener before the click.
    await page.evaluate(() => {
      // @ts-ignore
      window.__auditMutations = 0;
      // @ts-ignore
      window.__auditScrolls = 0;
      // @ts-ignore
      window.__auditObs?.disconnect?.();
      // @ts-ignore
      window.__auditObs = new MutationObserver((records) => {
        // @ts-ignore
        window.__auditMutations += records.length;
      });
      // @ts-ignore
      window.__auditObs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      // @ts-ignore
      window.__auditScrollHandler = () => {
        // @ts-ignore
        window.__auditScrolls++;
      };
      // @ts-ignore
      window.addEventListener("scroll", window.__auditScrollHandler, {
        capture: true,
        passive: true,
      });
    });

    let clickError = null;
    try {
      await handle.click({ timeout: 800, force: false, noWaitAfter: true });
    } catch (err) {
      clickError = String(err?.message || err).split("\n")[0];
    }
    await page.waitForTimeout(280);

    const urlAfter = page.url();
    const { mutations, scrolls } = await page.evaluate(() => {
      // @ts-ignore
      const m = window.__auditMutations || 0;
      // @ts-ignore
      const s = window.__auditScrolls || 0;
      // @ts-ignore
      window.__auditObs?.disconnect?.();
      // @ts-ignore
      window.removeEventListener("scroll", window.__auditScrollHandler, true);
      return { mutations: m, scrolls: s };
    });

    const changed = urlBefore !== urlAfter || mutations > 0 || scrolls > 0;

    if (!changed) {
      dead.push({
        text: meta.text,
        aria: meta.aria,
        html: meta.html,
        clickError,
      });
    }

    // Reset if URL shifted; press Escape to close any modal/drawer opened.
    if (urlAfter !== urlBefore) {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    } else if (mutations > 0) {
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(80);
      // If a dropdown/menu likely opened, also click a benign corner to dismiss any
      // click-outside listener based popovers.
      await page.mouse.click(2, 2).catch(() => {});
      await page.waitForTimeout(60);
    }
  }

  results.push({
    route,
    loadStatus,
    dead,
    broken,
    consoleErrors,
    pageErrors,
  });

  process.stdout.write(
    `  ${route}  dead=${dead.length} 404=${broken.length} console=${consoleErrors.length}\n`,
  );

  await page.close();
}

await browser.close();

/* ---- Write reports ---- */

const outJson = path.resolve("audit-report.json");
fs.writeFileSync(outJson, JSON.stringify(results, null, 2));

const totalDead = results.reduce((n, r) => n + r.dead.length, 0);
const totalBroken = results.reduce((n, r) => n + r.broken.length, 0);
const totalConsole = results.reduce((n, r) => n + r.consoleErrors.length, 0);
const totalPageErrors = results.reduce((n, r) => n + r.pageErrors.length, 0);

const md = [];
md.push("# Clickable audit\n");
md.push(`- Base: \`${BASE}\``);
md.push(`- Routes scanned: ${results.length}`);
md.push(`- Dead buttons: ${totalDead}`);
md.push(`- 404 links: ${totalBroken}`);
md.push(`- Console errors: ${totalConsole}`);
md.push(`- Page errors: ${totalPageErrors}\n`);

for (const r of results) {
  if (
    r.dead.length === 0 &&
    r.broken.length === 0 &&
    r.consoleErrors.length === 0 &&
    r.pageErrors.length === 0
  ) {
    continue;
  }
  md.push(`## ${r.route}`);
  md.push(`- load: ${r.loadStatus}`);
  if (r.dead.length) {
    md.push(`\n### Dead buttons (${r.dead.length})`);
    for (const d of r.dead) {
      const label = d.aria || d.text || "(empty)";
      md.push(`- \`${label}\`` + (d.clickError ? ` — click error: ${d.clickError}` : ""));
      md.push(`  \`\`\`html\n  ${d.html}\n  \`\`\``);
    }
  }
  if (r.broken.length) {
    md.push(`\n### 404 links (${r.broken.length})`);
    for (const b of r.broken) {
      md.push(`- \`${b.href}\` → ${b.status}  (${b.aria || b.text || "(empty)"})`);
    }
  }
  if (r.consoleErrors.length) {
    md.push(`\n### Console errors (${r.consoleErrors.length})`);
    for (const c of r.consoleErrors) md.push("- " + c.replace(/\n/g, " "));
  }
  if (r.pageErrors.length) {
    md.push(`\n### Page errors (${r.pageErrors.length})`);
    for (const c of r.pageErrors) md.push("- " + c.replace(/\n/g, " "));
  }
  md.push("");
}

fs.writeFileSync(path.resolve("audit-report.md"), md.join("\n"));

console.log(
  `\nSummary: dead=${totalDead}  404=${totalBroken}  console=${totalConsole}  page=${totalPageErrors}`,
);
console.log("Reports: audit-report.json, audit-report.md");

if (totalDead > 0 || totalBroken > 0 || totalPageErrors > 0) process.exit(1);
