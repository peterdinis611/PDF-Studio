import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import type { PDFDocument, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { GOOGLE_FONTS } from "../../shared/types.js";

const require = createRequire(import.meta.url);

/** App font id → @fontsource package name (offline fallback) */
const GOOGLE_FONT_PACKAGES: Record<string, string> = {
  Inter: "@fontsource/inter",
  Roboto: "@fontsource/roboto",
  OpenSans: "@fontsource/open-sans",
  Lora: "@fontsource/lora",
  Playfair: "@fontsource/playfair-display",
};

/** File slug inside package/files/ (latin subset) */
const GOOGLE_FONT_SLUGS: Record<string, string> = {
  Inter: "inter",
  Roboto: "roboto",
  OpenSans: "open-sans",
  Lora: "lora",
  Playfair: "playfair-display",
};

/** UA that prefers TrueType from fonts.googleapis.com CSS API */
const GOOGLE_CSS_UA =
  "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)";

const FONT_CACHE_DIR = path.join(os.tmpdir(), "pdf-studio-font-cache");

export type FontNeed = { family: string; bold: boolean; italic: boolean };

const knownById = new Map<string, (typeof GOOGLE_FONTS)[number]>(
  GOOGLE_FONTS.map((f) => [f.id, f]),
);

export function resolveGoogleFamilyName(family: string): string | null {
  if (!family) return null;
  if (family.startsWith("google:")) {
    const name = family.slice("google:".length).trim();
    return name || null;
  }
  const known = knownById.get(family);
  if (known) return known.googleFamily;
  if (family in GOOGLE_FONT_PACKAGES) return family;
  return null;
}

export function isGoogleFontFamily(family: string): boolean {
  return resolveGoogleFamilyName(family) !== null;
}

function variantSuffix(bold: boolean, italic: boolean): string {
  const weight = bold ? "700" : "400";
  const style = italic ? "italic" : "normal";
  return `${weight}-${style}`;
}

function cacheKey(family: string, bold: boolean, italic: boolean): string {
  return `${family}:${bold ? "b" : "n"}:${italic ? "i" : "n"}`;
}

function localFontFilePath(family: string, bold: boolean, italic: boolean): string | null {
  const pkgName = GOOGLE_FONT_PACKAGES[family];
  const slug = GOOGLE_FONT_SLUGS[family];
  if (!pkgName || !slug) return null;
  try {
    const root = path.dirname(require.resolve(`${pkgName}/package.json`));
    return path.join(root, "files", `${slug}-latin-${variantSuffix(bold, italic)}.woff`);
  } catch {
    return null;
  }
}

function googleCssUrl(googleFamily: string): string {
  const familyParam = encodeURIComponent(googleFamily).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
}

/** Parse @font-face blocks and pick a file URL for the requested weight/style. */
export function pickFontUrlFromCss(
  css: string,
  bold: boolean,
  italic: boolean,
): string | null {
  const wantWeight = bold ? "700" : "400";
  const wantStyle = italic ? "italic" : "normal";
  const faces = css.split("@font-face");
  let fallback: string | null = null;

  for (const block of faces) {
    if (!block.includes("src:")) continue;
    const styleMatch = /font-style:\s*([^;}+]+)/i.exec(block);
    const weightMatch = /font-weight:\s*([^;}+]+)/i.exec(block);
    const urlMatch = /url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^)'"]+)\1\)/i.exec(block);
    if (!urlMatch) continue;
    const url = urlMatch[2];
    const style = (styleMatch?.[1] || "normal").trim();
    const weight = (weightMatch?.[1] || "400").trim();
    if (!fallback) fallback = url;
    if (style === wantStyle && (weight === wantWeight || weight.includes(wantWeight))) {
      return url;
    }
  }
  return fallback;
}

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(FONT_CACHE_DIR, { recursive: true });
}

function diskCachePath(googleFamily: string, bold: boolean, italic: boolean, ext: string): string {
  const safe = googleFamily.replace(/[^a-zA-Z0-9_-]+/g, "_");
  return path.join(FONT_CACHE_DIR, `${safe}-${variantSuffix(bold, italic)}.${ext}`);
}

async function fetchGoogleFontBytes(
  googleFamily: string,
  bold: boolean,
  italic: boolean,
): Promise<Uint8Array | null> {
  const cachedTtf = diskCachePath(googleFamily, bold, italic, "ttf");
  const cachedWoff = diskCachePath(googleFamily, bold, italic, "woff");
  for (const p of [cachedTtf, cachedWoff]) {
    try {
      return new Uint8Array(await fs.readFile(p));
    } catch {
      /* miss */
    }
  }

  try {
    const cssRes = await fetch(googleCssUrl(googleFamily), {
      headers: {
        "User-Agent": GOOGLE_CSS_UA,
        Accept: "text/css,*/*;q=0.1",
      },
    });
    if (!cssRes.ok) {
      console.warn(`Google Fonts CSS ${cssRes.status} for ${googleFamily}`);
      return null;
    }
    const css = await cssRes.text();
    const fileUrl = pickFontUrlFromCss(css, bold, italic);
    if (!fileUrl) {
      console.warn(`No font URL in Google CSS for ${googleFamily}`);
      return null;
    }
    const fileRes = await fetch(fileUrl, {
      headers: { "User-Agent": GOOGLE_CSS_UA },
    });
    if (!fileRes.ok) {
      console.warn(`Google font file ${fileRes.status}: ${fileUrl}`);
      return null;
    }
    const buf = new Uint8Array(await fileRes.arrayBuffer());
    await ensureCacheDir();
    const ext = fileUrl.includes(".woff2") ? "woff2" : fileUrl.includes(".woff") ? "woff" : "ttf";
    if (ext !== "woff2") {
      await fs.writeFile(diskCachePath(googleFamily, bold, italic, ext), buf);
    }
    return buf;
  } catch (err) {
    console.warn(`Google Fonts fetch failed for ${googleFamily}:`, err);
    return null;
  }
}

async function loadFontBytes(
  familyId: string,
  bold: boolean,
  italic: boolean,
): Promise<Uint8Array | null> {
  const googleFamily = resolveGoogleFamilyName(familyId);
  if (!googleFamily) return null;

  // Prefer live Google APIs (CSS + gstatic), then bundled @fontsource.
  const fromGoogle = await fetchGoogleFontBytes(googleFamily, bold, italic);
  if (fromGoogle) return fromGoogle;

  const localPath = localFontFilePath(familyId, bold, italic);
  if (!localPath) return null;
  try {
    return new Uint8Array(await fs.readFile(localPath));
  } catch {
    return null;
  }
}

/**
 * Embed Google fonts so exported PDF text matches the editor.
 * Fetches from fonts.googleapis.com / fonts.gstatic.com, with @fontsource fallback.
 */
export async function embedGoogleFonts(
  doc: PDFDocument,
  needs: FontNeed[],
): Promise<Map<string, PDFFont>> {
  doc.registerFontkit(fontkit);
  const embedded = new Map<string, PDFFont>();
  const keys = new Set<string>();

  for (const need of needs) {
    if (!isGoogleFontFamily(need.family)) continue;
    keys.add(cacheKey(need.family, need.bold, need.italic));
    keys.add(cacheKey(need.family, false, false));
  }

  for (const key of keys) {
    const [family, b, i] = key.split(":");
    const bold = b === "b";
    const italic = i === "i";
    const bytes = await loadFontBytes(family, bold, italic);
    if (!bytes) continue;
    try {
      const font = await doc.embedFont(bytes, { subset: true });
      embedded.set(key, font);
    } catch (err) {
      console.warn(`Could not embed font ${key}:`, err);
    }
  }

  return embedded;
}

export function pickGoogleFont(
  embedded: Map<string, PDFFont>,
  family: string,
  bold: boolean,
  italic: boolean,
): PDFFont | null {
  if (!isGoogleFontFamily(family)) return null;
  return (
    embedded.get(cacheKey(family, bold, italic)) ||
    embedded.get(cacheKey(family, bold, false)) ||
    embedded.get(cacheKey(family, false, italic)) ||
    embedded.get(cacheKey(family, false, false)) ||
    null
  );
}
