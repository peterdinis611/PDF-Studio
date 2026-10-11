/** Token context for {{page}}, {{pages}}, {{seq}}, and mail-merge fields. */
export type TokenContext = Record<string, string | number | undefined | null>;

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.-]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g;

/**
 * Replace `{{token}}` placeholders.
 * Built-ins: page (1-based), pages, seq (1-based pack index), bates (zero-padded seq).
 * Optional pipe: `{{seq|0003}}` / `{{bates|INV-0001}}` for padding / prefix+pad.
 */
export function substituteTokens(
  text: string,
  pageIndex: number,
  pageCount: number,
  fields?: TokenContext,
): string {
  const seq = Number(fields?.seq ?? pageIndex + 1);
  const ctx: Record<string, string> = {
    page: String(pageIndex + 1),
    pages: String(pageCount),
    seq: String(seq),
    bates: String(seq).padStart(4, "0"),
  };
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      ctx[key] = String(value);
    }
  }
  return text.replace(TOKEN_RE, (match, key: string, fmt?: string) => {
    if (!Object.prototype.hasOwnProperty.call(ctx, key) && key !== "bates" && key !== "seq") {
      return match;
    }
    let value = ctx[key] ?? "";
    if (fmt && (key === "seq" || key === "bates")) {
      const padMatch = fmt.match(/^(.*?)(\d+)$/);
      if (padMatch) {
        const prefix = padMatch[1];
        const width = padMatch[2].length;
        value = prefix + String(seq).padStart(width, "0");
      } else if (/^\d+$/.test(fmt)) {
        value = String(seq).padStart(fmt.length, "0");
      } else {
        value = fmt.replace(/#+/g, (h) => String(seq).padStart(h.length, "0"));
      }
    }
    return value;
  });
}

/** Replace only keys present in `fields` (leaves {{page}}/{{pages}}/{{seq}} intact unless provided). */
export function substituteMergeFields(text: string, fields: TokenContext): string {
  if (!fields || !Object.keys(fields).length) return text;
  return text.replace(TOKEN_RE, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(fields, key) && fields[key] != null) {
      return String(fields[key]);
    }
    return match;
  });
}

/** Collect unique token names from text (excluding built-ins when stripBuiltins). */
export function extractTokenNames(text: string, stripBuiltins = true): string[] {
  const builtins = new Set(["page", "pages", "seq", "bates"]);
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_.-]+)(?:\s*\|[^}]*)?\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (stripBuiltins && builtins.has(m[1])) continue;
    found.add(m[1]);
  }
  return [...found];
}

type TokenBearing = {
  type: string;
  content?: string;
  cells?: string[] | string[][];
  label?: string;
  href?: string;
  alt?: string;
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
  if (typeof el.href === "string") {
    el.href = substituteTokens(el.href, pageIndex, pageCount, fields);
  }
  if (typeof el.alt === "string") {
    el.alt = substituteTokens(el.alt, pageIndex, pageCount, fields);
  }
  if (Array.isArray(el.cells)) {
    el.cells = mapCells(el.cells, (cell) => substituteTokens(cell, pageIndex, pageCount, fields));
  }
}

export function applyMergeFieldsToElement(el: TokenBearing, fields: TokenContext): void {
  if (typeof el.content === "string") {
    el.content = substituteMergeFields(el.content, fields);
  }
  if (typeof el.label === "string") {
    el.label = substituteMergeFields(el.label, fields);
  }
  if (typeof el.href === "string") {
    el.href = substituteMergeFields(el.href, fields);
  }
  if (typeof el.alt === "string") {
    el.alt = substituteMergeFields(el.alt, fields);
  }
  if (Array.isArray(el.cells)) {
    el.cells = mapCells(el.cells, (cell) => substituteMergeFields(cell, fields));
  }
}

/** Detect http(s) URLs in plain text for link annotations. */
export function findUrlsInText(text: string): { url: string; index: number; length: number }[] {
  const re = /https?:\/\/[^\s<>"')\]]+/gi;
  const out: { url: string; index: number; length: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let url = m[0];
    // Trim trailing punctuation
    url = url.replace(/[.,;:!?)]+$/, "");
    out.push({ url, index: m.index, length: url.length });
  }
  return out;
}
