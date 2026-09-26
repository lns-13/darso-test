/**
 * Screenshots the surfaces Task 04 touched, for a visual check.
 * Requires `next dev` on the port below.
 *
 *   node scripts/shoot-task04.mjs [port] [outDir]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const port = process.argv[2] ?? "3100";
const outDir = process.argv[3] ?? "screenshots";
const base = `http://localhost:${port}`;

const shots = [
  ["preview-desktop", "/teacher/preview/nadia-belkacem", 1280, 1000],
  ["preview-mobile", "/teacher/preview/nadia-belkacem", 390, 900],
  ["preview-not-found", "/teacher/preview/ce-prof-nexiste-pas", 1280, 700],
  ["profile-signed-out", "/teacher/profile", 1280, 700],
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const [name, path, width, height] of shots) {
  const page = await browser.newPage({ viewport: { width, height } });
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
  console.log(`${String(response?.status()).padEnd(4)} ${name.padEnd(20)} ${path}`);
  await page.close();
}
await browser.close();
console.log(`\nSaved to ${outDir}/`);
