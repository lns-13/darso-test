import { chromium } from "playwright";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const url = process.env.URL ?? "http://localhost:3000/student";
const outDir = path.resolve("screenshots");
fs.mkdirSync(outDir, { recursive: true });

// Claude's many-image API rejects any dimension > 2000px. Keep a small margin.
const MAX_DIM = 1990;

const breakpoints = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

const browser = await chromium.launch();

for (const bp of breakpoints) {
  const context = await browser.newContext({
    viewport: { width: bp.width, height: bp.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const filePath = path.join(outDir, `${bp.name}.png`);
  const buf = await page.screenshot({ fullPage: true, type: "png" });

  const meta = await sharp(buf).metadata();
  const overflow = Math.max(meta.width ?? 0, meta.height ?? 0) > MAX_DIM;

  if (overflow) {
    const scale = MAX_DIM / Math.max(meta.width, meta.height);
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));
    await sharp(buf).resize(w, h, { kernel: "lanczos3" }).png().toFile(filePath);
    console.log(
      `✓ ${bp.name} (${bp.width}×${bp.height}) → ${filePath}  [${meta.width}×${meta.height} → ${w}×${h}]`,
    );
  } else {
    await fs.promises.writeFile(filePath, buf);
    console.log(
      `✓ ${bp.name} (${bp.width}×${bp.height}) → ${filePath}  [${meta.width}×${meta.height}]`,
    );
  }

  await context.close();
}

await browser.close();
