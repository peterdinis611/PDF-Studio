/** Token context for {{page}}, {{pages}}, and mail-merge fields. */
export type TokenContext = Record<string, string | number | undefined | null>;

/**
 * Replace `{{token}}` placeholders. Built-ins: page (1-based), pages.
 * Extra keys from `fields` override / extend (case-sensitive keys).
 */
export function substituteTokens(
  text: string,
  pageIndex: number,
  pageCount: number,
  fields?: TokenContext,
): string {
  const ctx: Record<string, string> = {
    page: String(pageIndex + 1),
    pages: String(pageCount),
  };
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      ctx[key] = String(value);
    }
  }
  return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(ctx, key)) return ctx[key];
    return match;
  });
}

/** Replace only keys present in `fields` (leaves {{page}}/{{pages}} intact). */
export function substituteMergeFields(text: string, fields: TokenContext): string {
  if (!fields || !Object.keys(fields).length) return text;
  return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] != null) {
      return String(fields[key]);
    }
    return match;
  });
}

type TokenBearing = {
  type: string;
  content?: string;
  /** Flat table cells (row-major) or nested rows. */
  cells?: string[] | string[][];
  label?: string;
};

function mapCells(
  cells: string[] | string[][],
  map: (cell: string) => string,
): string[] | string[][] {
  if (!cells.length) return cells;
  if (Array.isArray(cells[0])) {
    return (cells as string[][]).map((row) => row.map((cell) => map(cell || "")));
  }
  return (cells as string[]).map((cell) => map(cell || ""));
}

/** Apply token substitution to every text-bearing field on an element (mutates clone). */
export function substituteElementTokens(
  el: TokenBearing,
  pageIndex: number,
  pageCount: number,
  fields?: TokenContext,
): void {
  if (typeof el.content === "string") {
    el.content = substituteTokens(el.content, pageIndex, pageCount, fields);
  }
  if (typeof el.label === "string") {
    el.label = substituteTokens(el.label, pageIndex, pageCount, fields);
  }
  if (Array.isArray(el.cells)) {
    el.cells = mapCells(el.cells, (cell) => substituteTokens(cell, pageIndex, pageCount, fields));
  }
}

/** Apply only mail-merge fields (mutates). Keeps {{page}}/{{pages}} for export. */
export function applyMergeFieldsToElement(el: TokenBearing, fields: TokenContext): void {
  if (typeof el.content === "string") {
    el.content = substituteMergeFields(el.content, fields);
  }
  if (typeof el.label === "string") {
    el.label = substituteMergeFields(el.label, fields);
  }
  if (Array.isArray(el.cells)) {
    el.cells = mapCells(el.cells, (cell) => substituteMergeFields(cell, fields));
  }
}
