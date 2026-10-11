import type { PdfDocument, PdfElement } from "../shared/types.js";
import { PAGE_SIZES } from "../shared/types.js";
import { collectDocTokens } from "./mailMerge.js";

export type PreflightIssue = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
};

/** Lightweight print preflight / accessibility checklist. */
export function runPreflight(doc: PdfDocument): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const size = PAGE_SIZES[doc.pageSize] ?? PAGE_SIZES.a4;
  const bleed = 9; // ~3mm in pt

  let imageWithoutAlt = 0;
  let redactCount = 0;
  let fonts = new Set<string>();
  let textCount = 0;

  const visit = (el: PdfElement) => {
    if (el.type === "text") {
      textCount++;
      fonts.add(el.fontFamily || "Helvetica");
    }
    if (el.type === "image") {
      if (!el.alt?.trim()) imageWithoutAlt++;
    }
    if (el.type === "rect" && el.redact) redactCount++;
    // Elements too close to trim
    if (el.x < bleed || el.y < bleed || el.x + el.width > size.width - bleed || el.y + el.height > size.height - bleed) {
      if (el.type === "text" || el.type === "image") {
        issues.push({
          level: "warn",
          code: "bleed.margin",
          message: `${el.type} “${el.id.slice(0, 8)}” sits inside ${bleed}pt of page edge`,
        });
      }
    }
  };

  for (const page of doc.pages) for (const el of page.elements) visit(el);
  for (const el of [...(doc.master?.header || []), ...(doc.master?.footer || [])]) visit(el);

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

  if (redactCount) {
    issues.push({
      level: "info",
      code: "redact.count",
      message: `${redactCount} redaction rectangle(s) will burn opaque black on export`,
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

  // Crude ink coverage hint: many large dark fills
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

  return issues;
}
