import * as XLSX from "xlsx";
import type { PdfDocument, PdfElement, PdfPage, TableElement } from "../shared/types.js";
import { applyMergeFieldsToElement, extractTokenNames } from "../shared/tokens.js";
import { uid } from "./factories.js";

export type MailMergeRow = Record<string, string>;

export type MergeOutputMode = "single" | "zip";

export type MergeCondition = {
  field: string;
  /** equals | notEquals | empty | notEmpty | contains */
  op: "equals" | "notEquals" | "empty" | "notEmpty" | "contains";
  value?: string;
};

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

/** Parse JSON array of objects or `{ rows: [...] }`. */
export function parseJsonMerge(text: string): { headers: string[]; rows: MailMergeRow[] } {
  const raw = JSON.parse(text) as unknown;
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { rows?: unknown }).rows)
      ? (raw as { rows: unknown[] }).rows
      : null;
  if (!list?.length) return { headers: [], rows: [] };

  const headersSet = new Set<string>();
  const rows: MailMergeRow[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row: MailMergeRow = {};
    for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
      headersSet.add(k);
      row[k] = v == null ? "" : String(v);
    }
    rows.push(row);
  }
  return { headers: [...headersSet], rows };
}

/** Parse first sheet of an XLSX/XLS workbook. */
export function parseXlsxMerge(buffer: ArrayBuffer): { headers: string[]; rows: MailMergeRow[] } {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!json.length) return { headers: [], rows: [] };
  const headersSet = new Set<string>();
  const rows: MailMergeRow[] = json.map((item) => {
    const row: MailMergeRow = {};
    for (const [k, v] of Object.entries(item)) {
      headersSet.add(String(k));
      row[String(k)] = v == null ? "" : String(v);
    }
    return row;
  });
  return { headers: [...headersSet], rows };
}

export async function parseMergeFile(file: File): Promise<{ headers: string[]; rows: MailMergeRow[] }> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json") || file.type.includes("json")) {
    return parseJsonMerge(await file.text());
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".ods")) {
    return parseXlsxMerge(await file.arrayBuffer());
  }
  return parseCsv(await file.text());
}

function remapElementIds(els: PdfElement[]): PdfElement[] {
  return els.map((el) => ({ ...structuredClone(el), id: uid() }));
}

export function evalMergeCondition(row: MailMergeRow, cond?: MergeCondition | null): boolean {
  if (!cond?.field) return true;
  const v = row[cond.field] ?? "";
  switch (cond.op) {
    case "empty":
      return !String(v).trim();
    case "notEmpty":
      return Boolean(String(v).trim());
    case "equals":
      return String(v) === (cond.value ?? "");
    case "notEquals":
      return String(v) !== (cond.value ?? "");
    case "contains":
      return String(v).includes(cond.value ?? "");
    default:
      return true;
  }
}

/**
 * Expand table rows that contain `{{items.*}}` style tokens using JSON array in row._items
 * or columns prefixed with `item.` repeating every N columns — simpler: row[`items`] is JSON array.
 */
export function expandTableFromItems(table: TableElement, row: MailMergeRow): TableElement {
  const raw = row.items || row._items || row.line_items;
  if (!raw) return table;
  let items: Record<string, string>[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return table;
    items = parsed.map((it) => {
      const out: Record<string, string> = {};
      if (it && typeof it === "object") {
        for (const [k, v] of Object.entries(it as Record<string, unknown>)) {
          out[k] = v == null ? "" : String(v);
        }
      }
      return out;
    });
  } catch {
    return table;
  }
  if (!items.length) return table;

  const cols = table.cols;
  const headerRows = table.header ? 1 : 0;
  const templateStart = headerRows;
  // Use first data row as template if present, else invent from item keys
  const hasTemplate = table.rows > headerRows;
  const templateCells = hasTemplate
    ? table.cells.slice(templateStart * cols, (templateStart + 1) * cols)
    : Object.keys(items[0]).slice(0, cols);

  const newCells = table.cells.slice(0, headerRows * cols);
  for (const item of items) {
    const fields = { ...row, ...item };
    for (let c = 0; c < cols; c++) {
      const key = Object.keys(item)[c];
      const tpl = String(templateCells[c] ?? (key ? `{{${key}}}` : ""));
      const tmp = { type: "text", content: tpl };
      applyMergeFieldsToElement(tmp, fields);
      newCells.push(tmp.content || "");
    }
  }

  const dataRows = items.length;
  const heightPerRow = table.rows > 0 ? table.height / table.rows : 22;
  return {
    ...table,
    rows: headerRows + dataRows,
    cells: newCells,
    height: Math.max(table.height, heightPerRow * (headerRows + dataRows)),
  };
}

export type ApplyMailMergeOptions = {
  /** Skip entire page set for a row when condition fails. */
  skipRowWhen?: MergeCondition | null;
  /** Hide elements whose `mergeHideWhen` matches. */
  expandTables?: boolean;
  /** 1-based starting sequence for {{seq}}/{{bates}}. */
  seqStart?: number;
};

/**
 * Expand a template document: for each data row, clone all pages and substitute
 * merge fields. Page/pages tokens are left for export (final page indices).
 */
export function applyMailMerge(
  doc: PdfDocument,
  rows: MailMergeRow[],
  options: ApplyMailMergeOptions = {},
): PdfDocument {
  if (!rows.length) return structuredClone(doc);

  const basePages = doc.pages;
  const pages: PdfPage[] = [];
  const seqStart = options.seqStart ?? 1;
  let seq = seqStart;

  for (const row of rows) {
    if (!evalMergeCondition(row, options.skipRowWhen)) continue;

    const rowFields: MailMergeRow = {
      ...row,
      seq: String(seq),
      bates: String(seq).padStart(4, "0"),
    };

    for (const page of basePages) {
      // Page-level hide: element or page meta `mergeSkipWhen` stored on first sticky note? Use page mergeHideWhen via comments — use doc-level: page elements with type badge "SKIP" — simpler: check page.elements for mergeCondition on element
      let elements = remapElementIds(page.elements);

      elements = elements.filter((el) => {
        const hide = (el as PdfElement & { mergeHideWhen?: MergeCondition }).mergeHideWhen;
        if (!hide) return true;
        // Hide when condition is TRUE
        return !evalMergeCondition(rowFields, hide);
      });

      elements = elements.map((el) => {
        if (options.expandTables !== false && el.type === "table") {
          el = expandTableFromItems(el as TableElement, rowFields);
        }
        applyMergeFieldsToElement(el, rowFields);
        return el;
      });

      pages.push({
        id: uid(),
        elements,
        applyMaster: page.applyMaster,
        sourcePageIndex: page.sourcePageIndex,
        rotation: page.rotation,
        mergeFields: { ...rowFields },
      });
    }
    seq++;
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

/** One document per row (for ZIP export). */
export function applyMailMergePerRow(
  doc: PdfDocument,
  rows: MailMergeRow[],
  options: ApplyMailMergeOptions = {},
): { row: MailMergeRow; doc: PdfDocument; seq: number }[] {
  const out: { row: MailMergeRow; doc: PdfDocument; seq: number }[] = [];
  let seq = options.seqStart ?? 1;
  for (const row of rows) {
    if (!evalMergeCondition(row, options.skipRowWhen)) continue;
    const merged = applyMailMerge(doc, [row], { ...options, seqStart: seq });
    merged.name = filenameFromRow(row, doc.name || "document", seq);
    out.push({ row, doc: merged, seq });
    seq++;
  }
  return out;
}

export function filenameFromRow(row: MailMergeRow, fallback: string, seq: number): string {
  const key =
    row.filename ||
    row.file_name ||
    row.name ||
    row.meno ||
    row.id ||
    "";
  const base = (key || `${fallback}-${seq}`).replace(/[^\w.\-]+/g, "_").slice(0, 80);
  return base.endsWith(".pdf") ? base.slice(0, -4) : base;
}

/** Insert a `{{field}}` token at the end of selected text content. */
export function appendToken(content: string, field: string): string {
  const token = `{{${field}}}`;
  if (!content) return token;
  return content.endsWith(" ") || content.endsWith("\n") ? content + token : `${content} ${token}`;
}

export function collectDocTokens(doc: PdfDocument): string[] {
  const found = new Set<string>();
  const visit = (el: PdfElement) => {
    const bits: string[] = [];
    if ("content" in el && typeof el.content === "string") bits.push(el.content);
    if ("label" in el && typeof (el as { label?: string }).label === "string") {
      bits.push((el as { label: string }).label);
    }
    if ("href" in el && typeof (el as { href?: string }).href === "string") {
      bits.push((el as { href: string }).href);
    }
    if ("cells" in el && Array.isArray((el as TableElement).cells)) {
      bits.push(...(el as TableElement).cells);
    }
    for (const b of bits) for (const t of extractTokenNames(b)) found.add(t);
  };
  for (const page of doc.pages) for (const el of page.elements) visit(el);
  for (const el of [...(doc.master?.header || []), ...(doc.master?.footer || [])]) visit(el);
  return [...found].sort();
}
