import { GOOGLE_FONTS, type FontFamily } from "../shared/types.js";

export const STANDARD_FONTS = [
  { id: "Helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "Times-Roman", label: "Times", css: '"Times New Roman", Times, serif' },
  { id: "Courier", label: "Courier", css: '"Courier New", Courier, monospace' },
] as const;

export function googleFamilyCssName(family: string): string | null {
  if (family.startsWith("google:")) {
    const name = family.slice("google:".length).trim();
    return name || null;
  }
  const known = GOOGLE_FONTS.find((f) => f.id === family);
  return known?.googleFamily ?? null;
}

export function fontCssFamily(family: FontFamily): string {
  const std = STANDARD_FONTS.find((f) => f.id === family);
  if (std) return std.css;
  const google = GOOGLE_FONTS.find((f) => f.id === family);
  if (google) return google.css;
  if (typeof family === "string" && family.startsWith("google:")) {
    const name = family.slice("google:".length).trim();
    if (name) return `"${name}", sans-serif`;
  }
  return STANDARD_FONTS[0].css;
}

/** CSS2 stylesheet URL for a Google font family name. */
export function googleFontsStylesheetUrl(googleFamily: string): string {
  const param = encodeURIComponent(googleFamily).replace(/%20/g, "+");
  return `https://fonts.googleapis.com/css2?family=${param}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
}

export function ensureGoogleFontStylesheet(googleFamily: string): void {
  if (typeof document === "undefined") return;
  const href = googleFontsStylesheetUrl(googleFamily);
  const marker = googleFamily.toLowerCase();
  const existing = Array.from(document.querySelectorAll("link[data-google-font]")).find(
    (el) => el.getAttribute("data-google-font")?.toLowerCase() === marker,
  );
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-google-font", googleFamily);
  document.head.appendChild(link);
}

export function allFontOptions(extra?: { id: string; label: string }[]): { id: string; label: string }[] {
  const base: { id: string; label: string }[] = [
    ...STANDARD_FONTS.map((f) => ({ id: f.id, label: f.label })),
    ...GOOGLE_FONTS.map((f) => ({ id: f.id, label: f.label })),
  ];
  if (!extra?.length) return base;
  const seen = new Set(base.map((f) => f.id));
  const out = [...base];
  for (const f of extra) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}
