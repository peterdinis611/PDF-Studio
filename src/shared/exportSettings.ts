import type { ExportSettings } from "./types.js";

export type PdfaMode = "off" | "friendly" | "strict";

/** Normalize legacy flatten / flattenForms. Prefer explicit flattenForms, else flatten. */
export function resolveFlattenForms(settings: Partial<ExportSettings> | undefined): boolean {
  if (!settings) return false;
  if ("flattenForms" in settings && typeof settings.flattenForms === "boolean") {
    return settings.flattenForms;
  }
  return Boolean(settings.flatten);
}

/** When true (default), markup/stamps burn into the page. When false, they are omitted from export. */
export function resolveFlattenAnnotations(settings: Partial<ExportSettings> | undefined): boolean {
  if (!settings) return true;
  if (typeof settings.flattenAnnotations === "boolean") return settings.flattenAnnotations;
  return true;
}

export function resolvePdfaMode(settings: Partial<ExportSettings> | undefined): PdfaMode {
  if (!settings) return "off";
  if (settings.pdfaMode === "off" || settings.pdfaMode === "friendly" || settings.pdfaMode === "strict") {
    return settings.pdfaMode;
  }
  return settings.pdfaLite ? "friendly" : "off";
}

/** Migrate persisted settings toward the new fields. */
export function normalizeExportSettings(raw: Partial<ExportSettings> | null | undefined): ExportSettings {
  const base: ExportSettings = {
    margin: 0,
    imageQuality: 0.85,
    flatten: false,
    flattenForms: false,
    flattenAnnotations: true,
    pdfaLite: false,
    pdfaMode: "off",
    intent: "screen",
    compressImages: true,
    includeComments: false,
    includeWatermark: true,
  };
  if (!raw) return base;
  const flattenForms = resolveFlattenForms(raw);
  const flattenAnnotations =
    "flattenAnnotations" in raw && typeof raw.flattenAnnotations === "boolean"
      ? raw.flattenAnnotations
      : true;
  const pdfaMode = resolvePdfaMode(raw);
  return {
    ...base,
    ...raw,
    flattenForms,
    flatten: flattenForms,
    flattenAnnotations,
    pdfaMode,
    pdfaLite: pdfaMode !== "off",
  };
}
