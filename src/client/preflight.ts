import type { ExportSettings, PdfDocument, PdfElement } from "../shared/types.js";
import { PAGE_SIZES } from "../shared/types.js";
import { resolvePdfaMode } from "../shared/exportSettings.js";
import { collectDocTokens } from "./mailMerge.js";

export type PreflightIssue = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  /** Element id to focus when clicking the issue. */
  elId?: string;
  pageIndex?: number;
};

export type PreflightReport = {
  issues: PreflightIssue[];
  summary: { error: number; warn: number; info: number };
};

/** Lightweight print preflight / accessibility checklist. */
export function runPreflight(
  doc: PdfDocument,
  exportSettings?: ExportSettings,
): PreflightIssue[] {
  return buildPreflightReport(doc, exportSettings).issues;
}

export function buildPreflightReport(
  doc: PdfDocument,
  exportSettings?: ExportSettings,
): PreflightReport {
  const issues: PreflightIssue[] = [];
  const size = PAGE_SIZES[doc.pageSize] ?? PAGE_SIZES.a4;
  const bleed = 9; // ~3mm in pt
  const pdfaMode = resolvePdfaMode(exportSettings);

  let imageWithoutAlt = 0;
  let redactCount = 0;
  let fonts = new Set<string>();
  let textCount = 0;
  let formCount = 0;
  let markupCount = 0;

  const visit = (el: PdfElement, pageIndex: number) => {
    if (el.type === "text") {
      textCount++;
      fonts.add(el.fontFamily || "Helvetica");
    }
    if (el.type === "image") {
      if (!el.alt?.trim()) imageWithoutAlt++;
    }
    if (el.type === "rect" && el.redact) redactCount++;
    if (el.type === "rect" && el.markup) markupCount++;
    if (el.type === "formText" || el.type === "formCheck" || el.type === "formSelect") formCount++;
    if (el.x < bleed || el.y < bleed || el.x + el.width > size.width - bleed || el.y + el.height > size.height - bleed) {
      if (el.type === "text" || el.type === "image") {
        issues.push({
          level: "warn",
          code: "bleed.margin",
          message: `${el.type} sits inside ${bleed}pt of page edge`,
          elId: el.id,
          pageIndex,
        });
      }
    }
  };

  doc.pages.forEach((page, pageIndex) => {
    for (const el of page.elements) visit(el, pageIndex);
  });
  for (const el of [...(doc.master?.header || []), ...(doc.master?.footer || [])]) {
    visit(el, 0);
  }

  if (imageWithoutAlt) {
    issues.push({
      level: "warn",
      code: "ua.alt",
      message: `${imageWithoutAlt} image(s) missing alt text (PDF/UA)`,
    });
  }

  if (!textCount) {
    issues.push({
      level: "info",
      code: "content.text",
      message: "Document has no text elements",
    });
  }

  issues.push({
    level: "info",
    code: "fonts.list",
    message: `Fonts used: ${[...fonts].join(", ") || "(none)"}`,
  });

  if (formCount) {
    issues.push({
      level: "info",
      code: "forms.count",
      message: `${formCount} fillable form field(s) — enable “Flatten form fields” to burn them into the page`,
    });
  }

  if (markupCount) {
    issues.push({
      level: "info",
      code: "annot.markup",
      message: `${markupCount} markup annotation(s) — controlled by “Flatten annotations” on export`,
    });
  }

  if (redactCount) {
    issues.push({
      level: "warn",
      code: "redact.count",
      message: `${redactCount} redaction rectangle(s) will burn opaque black on export — confirm before sharing`,
    });
  }

  const tokens = collectDocTokens(doc);
  if (tokens.length) {
    issues.push({
      level: "warn",
      code: "merge.tokens",
      message: `Unresolved merge tokens: ${tokens.map((t) => `{{${t}}}`).join(", ")}`,
    });
  }

  let darkArea = 0;
  for (const page of doc.pages) {
    for (const el of page.elements) {
      if (el.type === "rect" && (el.fill || "").toLowerCase() === "#000000") {
        darkArea += el.width * el.height;
      }
    }
  }
  const pageArea = size.width * size.height * Math.max(1, doc.pages.length);
  const coverage = darkArea / pageArea;
  if (coverage > 0.35) {
    issues.push({
      level: "warn",
      code: "ink.coverage",
      message: `High solid-black coverage (~${Math.round(coverage * 100)}%) — check print ink usage`,
    });
  }

  // PDF/A checklist
  if (pdfaMode === "off") {
    issues.push({
      level: "info",
      code: "pdfa.off",
      message: "PDF/A mode is off — enable Friendly or Strict in export settings for archival hints",
    });
  } else if (pdfaMode === "friendly") {
    issues.push({
      level: "info",
      code: "pdfa.friendly",
      message: "PDF/A-friendly: metadata + no object streams (not full conformance)",
    });
  } else {
    issues.push({
      level: "info",
      code: "pdfa.strict",
      message: "PDF/A strict: metadata, no encryption, no object streams — still best-effort, not veraPDF certified",
    });
    const customFonts = (doc.customFonts || []).length;
    if (!customFonts && fonts.size) {
      issues.push({
        level: "warn",
        code: "pdfa.fonts",
        message: "Strict PDF/A prefers embedded custom fonts; standard PDF fonts may not embed as subsets",
      });
    }
  }

  if (doc.pages.length === 0) {
    issues.push({ level: "error", code: "pages.empty", message: "Document has no pages" });
  }

  const summary = { error: 0, warn: 0, info: 0 };
  for (const i of issues) summary[i.level]++;
  // Sort: errors, warns, infos
  const rank = { error: 0, warn: 1, info: 2 };
  issues.sort((a, b) => rank[a.level] - rank[b.level]);

  return { issues, summary };
}
