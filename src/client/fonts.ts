import { GOOGLE_FONTS, type FontFamily } from "../shared/types.js";

export const STANDARD_FONTS = [
  { id: "Helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "Times-Roman", label: "Times", css: '"Times New Roman", Times, serif' },
  { id: "Courier", label: "Courier", css: '"Courier New", Courier, monospace' },
] as const;

export function fontCssFamily(family: FontFamily): string {
  const std = STANDARD_FONTS.find((f) => f.id === family);
  if (std) return std.css;
  const google = GOOGLE_FONTS.find((f) => f.id === family);
  if (google) return google.css;
  return STANDARD_FONTS[0].css;
}

export function allFontOptions() {
  return [
    ...STANDARD_FONTS.map((f) => ({ id: f.id, label: f.label })),
    ...GOOGLE_FONTS.map((f) => ({ id: f.id, label: f.label })),
  ];
}
