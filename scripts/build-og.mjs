/**
 * Renders public/og.png — the 1200x630 social card, set as the masthead.
 *
 * This is a one-off asset generator, not part of `npm run build`: the PNG is
 * committed, so it only needs re-running when the masthead design changes.
 * Puppeteer is deliberately not a dependency — install it just for the run:
 *
 *   npm i -D puppeteer && node scripts/build-og.mjs && npm uninstall puppeteer
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = path.join(root, "public/fonts");
const out = path.join(root, "public/og.png");

let puppeteer;
try {
  ({ default: puppeteer } = await import("puppeteer"));
} catch {
  console.error(
    "puppeteer is not installed. Run:\n  npm i -D puppeteer && node scripts/build-og.mjs && npm uninstall puppeteer",
  );
  process.exit(1);
}

const fontUrl = (name) => pathToFileURL(path.join(fontsDir, name)).href;

for (const f of [
  "bodoni-moda-latin-standard-normal.woff2",
  "bodoni-moda-latin-standard-italic.woff2",
  "courier-prime-latin-400-normal.woff2",
  "courier-prime-latin-700-normal.woff2",
]) {
  if (!fs.existsSync(path.join(fontsDir, f))) {
    console.error(`Missing ${f}. Run \`npm run build:fonts\` first.`);
    process.exit(1);
  }
}

const startOfYear = Date.UTC(new Date().getUTCFullYear(), 0, 0);
const edition = String(Math.floor((Date.now() - startOfYear) / 86_400_000)).padStart(3, "0");

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Bodoni Moda";
    font-style: normal;
    font-weight: 400 900;
    src: url("${fontUrl("bodoni-moda-latin-standard-normal.woff2")}") format("woff2-variations");
  }
  @font-face {
    font-family: "Bodoni Moda";
    font-style: italic;
    font-weight: 400 700;
    src: url("${fontUrl("bodoni-moda-latin-standard-italic.woff2")}") format("woff2-variations");
  }
  @font-face {
    font-family: "Courier Prime";
    font-style: normal;
    font-weight: 400;
    src: url("${fontUrl("courier-prime-latin-400-normal.woff2")}") format("woff2");
  }
  @font-face {
    font-family: "Courier Prime";
    font-style: normal;
    font-weight: 700;
    src: url("${fontUrl("courier-prime-latin-700-normal.woff2")}") format("woff2");
  }

  :root {
    --stock: #eae5da;
    --ink: #171513;
    --ink-2: #3e3933;
    --ink-3: #746c62;
    --red: #b0281b;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    background: var(--stock);
    color: var(--ink);
    font-family: "Courier Prime", monospace;
    overflow: hidden;
    position: relative;
  }

  .fiber {
    position: absolute;
    inset: 0;
    opacity: 0.2;
    mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)' opacity='0.55'/%3E%3C/svg%3E");
  }

  .wash {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 40% at 12% 0%, rgba(23,21,19,0.06), transparent 62%),
      radial-gradient(ellipse 45% 45% at 94% 25%, rgba(176,40,27,0.07), transparent 64%);
  }

  .sheet {
    position: relative;
    height: 100%;
    padding: 52px 64px 46px;
    display: flex;
    flex-direction: column;
  }

  .flanks {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink-3);
    padding-bottom: 14px;
  }

  .hair { height: 1px; background: rgba(23,21,19,0.55); }

  .nameplate {
    font-family: "Bodoni Moda";
    font-variation-settings: "opsz" 96;
    font-weight: 700;
    font-size: 128px;
    line-height: 0.9;
    letter-spacing: -0.03em;
    text-align: center;
    padding: 26px 0 20px;
  }

  .nameplate .the {
    display: block;
    font-size: 30px;
    font-style: italic;
    font-weight: 400;
    letter-spacing: 0.06em;
    color: var(--ink-2);
    margin-bottom: 10px;
  }

  .double { height: 5px; border-top: 3px solid var(--ink); border-bottom: 1px solid var(--ink); }

  .dateline {
    display: flex;
    justify-content: center;
    gap: 18px;
    padding: 14px 0;
    font-size: 15px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-2);
  }

  .dateline .dot { color: var(--red); letter-spacing: 0; }

  .lead {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 18px;
  }

  .headline {
    font-family: "Bodoni Moda";
    font-variation-settings: "opsz" 96;
    font-weight: 700;
    font-size: 58px;
    line-height: 1.04;
    letter-spacing: -0.025em;
    max-width: 20ch;
  }

  .headline em { font-style: italic; font-weight: 500; color: var(--red); }

  .kicker {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--red);
  }

  .foot {
    display: flex;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 3px solid var(--red);
    font-size: 15px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
</style></head>
<body>
  <div class="wash"></div>
  <div class="fiber"></div>
  <div class="sheet">
    <div class="flanks"><span>Vol. I &middot; No. ${edition}</span><span>Price: Free</span></div>
    <div class="hair"></div>
    <div class="nameplate"><span class="the">The</span>PDF Studio</div>
    <div class="double"></div>
    <div class="dateline">
      <span>Local-first edition</span><span class="dot">&#9670;</span>
      <span>Printed in your browser</span><span class="dot">&#9670;</span>
      <span>No account</span>
    </div>
    <div class="lead">
      <div class="kicker">Dispatch from the composing room</div>
      <div class="headline">Set the page, export a <em>real PDF</em></div>
    </div>
    <div class="foot"><span>Invoices &middot; Letters &middot; CVs &middot; Proposals</span><span>Fonts embedded</span></div>
  </div>
</body></html>`;

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out });
await browser.close();

console.log(`wrote ${path.relative(root, out)} (1200x630)`);
