import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import type { PDFDocument, PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const require = createRequire(import.meta.url);

/** App font id → @fontsource package name */
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

export type FontNeed = { family: string; bold: boolean; italic: boolean };

export function isGoogleFontFamily(family: string): boolean {
  return family in GOOGLE_FONT_PACKAGES;
}

function variantSuffix(bold: boolean, italic: boolean): string {
  const weight = bold ? "700" : "400";
  const style = italic ? "italic" : "normal";
  return `${weight}-${style}`;
}

function fontFilePath(family: string, bold: boolean, italic: boolean): string | null {
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

function cacheKey(family: string, bold: boolean, italic: boolean): string {
  return `${family}:${bold ? "b" : "n"}:${italic ? "i" : "n"}`;
}

/**
 * Embed selected Google fonts so exported PDF text matches the editor.
 * Uses @pdf-lib/fontkit for WOFF support.
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
    // Always ensure regular exists as fallback for the family
    keys.add(cacheKey(need.family, false, false));
  }

  for (const key of keys) {
    const [family, b, i] = key.split(":");
    const bold = b === "b";
    const italic = i === "i";
    const filePath = fontFilePath(family, bold, italic);
    if (!filePath) continue;
    try {
      const bytes = await fs.readFile(filePath);
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
