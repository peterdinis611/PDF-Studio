import type { PdfDocument, PdfElement, PdfPage } from "../shared/types.js";
import { applyMergeFieldsToElement } from "../shared/tokens.js";
import { uid } from "./factories.js";

export type MailMergeRow = Record<string, string>;

/** Parse CSV with header row. Supports quoted fields. */
export function parseCsv(text: string): { headers: string[]; rows: MailMergeRow[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^\uFEFF/, "").trim());
  const rows: MailMergeRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = parseLine(line);
    if (cells.every((c) => !c)) continue;
    const row: MailMergeRow = {};
    headers.forEach((h, i) => {
      if (!h) return;
      row[h] = cells[i] ?? "";
    });
    rows.push(row);
  }
  return { headers: headers.filter(Boolean), rows };
}

function remapElementIds(els: PdfElement[]): PdfElement[] {
  return els.map((el) => ({ ...structuredClone(el), id: uid() }));
}

/**
 * Expand a template document: for each CSV row, clone all pages and substitute
 * merge fields. Page/pages tokens are left for export (final page indices).
 */
export function applyMailMerge(doc: PdfDocument, rows: MailMergeRow[]): PdfDocument {
  if (!rows.length) return structuredClone(doc);

  const basePages = doc.pages;
  const pages: PdfPage[] = [];

  for (const row of rows) {
    for (const page of basePages) {
      const elements = remapElementIds(page.elements);
      for (const el of elements) {
        applyMergeFieldsToElement(el, row);
      }
      pages.push({
        id: uid(),
        elements,
        applyMaster: page.applyMaster,
        sourcePageIndex: page.sourcePageIndex,
        rotation: page.rotation,
        mergeFields: { ...row },
      });
    }
  }

  return {
    ...structuredClone(doc),
    id: uid(),
    name: `${doc.name || "Document"} (merged)`,
    pages,
    comments: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Insert a `{{field}}` token at the end of selected text content. */
export function appendToken(content: string, field: string): string {
  const token = `{{${field}}}`;
  if (!content) return token;
  return content.endsWith(" ") || content.endsWith("\n") ? content + token : `${content} ${token}`;
}
