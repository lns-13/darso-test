import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3001";
const outDir = path.resolve("screenshots");
fs.mkdirSync(outDir, { recursive: true });
const MAX_DIM = 1990;

// Standard + non-standard widths. Non-standard values land in the awkward
// zones between Tailwind defaults + the app's custom min-[900px] /
// min-[1080px] / min-[1180px] breakpoints.
const breakpoints = [
  // standard
  { name: "375", width: 375, height: 812 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
  // non-standard
  { name: "500", width: 500, height: 900 },
  { name: "620", width: 620, height: 900 },
  { name: "720", width: 720, height: 1000 },
  { name: "820", width: 820, height: 1000 },
  { name: "899", width: 899, height: 1000 },
  { name: "901", width: 901, height: 1000 },
  { name: "1000", width: 1000, height: 900 },
  { name: "1079", width: 1079, height: 900 },
  { name: "1081", width: 1081, height: 900 },
  { name: "1179", width: 1179, height: 900 },
  { name: "1181", width: 1181, height: 900 },
];

const pages = (
  process.env.PAGES ??
  "/student,/student/sessions,/student/discover,/student/payments,/student/favorites,/student/notifications,/student/messages,/student/profile"
).split(",");

const browser = await chromium.launch();

for (const p of pages) {
  const safe = p.replace(/[^a-z0-9]/gi, "_").replace(/^_+|_+$/g, "");
  for (const bp of breakpoints) {
    const ctx = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(250);
      const buf = await page.screenshot({ fullPage: true, type: "png" });
      const meta = await sharp(buf).metadata();
      const filePath = path.join(outDir, `sweep-${safe}-${bp.name}.png`);
      if (Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_DIM) {
        const scale = MAX_DIM / Math.max(meta.width, meta.height);
        const w = Math.max(1, Math.round(meta.width * scale));
        const h = Math.max(1, Math.round(meta.height * scale));
        await sharp(buf).resize(w, h, { kernel: "lanczos3" }).png().toFile(filePath);
      } else {
        await fs.promises.writeFile(filePath, buf);
      }
      // Detect horizontal overflow at this width.
      const overflowX = await page.evaluate(() => {
        const w = document.documentElement.scrollWidth;
        const vw = window.innerWidth;
        return w > vw + 1 ? w - vw : 0;
      });
      const line = `${p}  ${bp.width}px  overflowX=${overflowX}px`;
      console.log(line);
    } catch (err) {
      console.log(`${p}  ${bp.width}px  ERROR ${String(err.message).slice(0, 80)}`);
    }
    await ctx.close();
  }
}

await browser.close();
