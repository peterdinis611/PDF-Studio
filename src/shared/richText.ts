/**
 * TipTap rich-text helpers (HTML in TextElement.content when `rich: true`).
 */

export const RICH_TEXT_SAMPLE = `<h1>Document title</h1>
<h2>Section heading</h2>
<p>Body copy with <strong>bold</strong>, <em>italic</em>, and a short list:</p>
<ul>
  <li>First point</li>
  <li>Second point</li>
</ul>
<blockquote><p>A short quoted note.</p></blockquote>
<h3>Subsection</h3>
<p>Keep editing with the TipTap toolbar — H1 / H2 / H3, links, and color included.</p>`;

export type RichInlineRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
  href?: string;
};

export type RichStyledLine = {
  text: string;
  sizeScale: number;
  bold?: boolean;
  italic?: boolean;
  quote?: boolean;
  codeBlock?: boolean;
  runs?: RichInlineRun[];
  /** Table row cells (plain text). */
  tableCells?: string[];
};

/** Strip tags for thumbnails / labels. */
export function richHtmlToPlainText(html: string): string {
  return (html || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * HTML → styled lines with optional inline runs for pdf-lib export.
 */
export function richHtmlToStyledLines(html: string): RichStyledLine[] {
  const source = (html || "").trim();
  if (!source) return [{ text: "", sizeScale: 1, runs: [{ text: "" }] }];

  const normalized = source
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "");

  const lines: RichStyledLine[] = [];

  // Tables first
  const tableRe = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;
  const tableRanges: { start: number; end: number }[] = [];
  while ((tableMatch = tableRe.exec(normalized))) {
    tableRanges.push({ start: tableMatch.index, end: tableMatch.index + tableMatch[0].length });
    const body = tableMatch[1];
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let row: RegExpExecArray | null;
    while ((row = rowRe.exec(body))) {
      const cells: string[] = [];
      const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let cell: RegExpExecArray | null;
      while ((cell = cellRe.exec(row[1]))) {
        cells.push(richHtmlToPlainText(cell[1]).replace(/\s+/g, " ").trim());
      }
      if (cells.length) {
        lines.push({
          text: cells.join(" | "),
          sizeScale: 1,
          tableCells: cells,
          runs: [{ text: cells.join(" | ") }],
        });
      }
    }
  }

  const withoutTables = normalized.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, "");

  const blockRe =
    /<(h([123])|p|li|blockquote|pre)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(withoutTables))) {
    const tag = match[1].toLowerCase();
    const level = match[2];
    let inner = match[3];
    let sizeScale = 1;
    let quote = false;
    let codeBlock = false;
    if (tag === "h1" || level === "1") sizeScale = 1.75;
    else if (tag === "h2" || level === "2") sizeScale = 1.4;
    else if (tag === "h3" || level === "3") sizeScale = 1.2;
    if (tag === "blockquote") {
      quote = true;
      inner = inner.replace(/<\/?p[^>]*>/gi, "");
    }
    if (tag === "pre") {
      codeBlock = true;
      inner = inner.replace(/<\/?code[^>]*>/gi, "");
    }

    const runs = parseInlineRuns(inner);
    let lineText = runs.map((r) => r.text).join("").replace(/\s+/g, " ").trim();
    if (tag === "li" && lineText) lineText = `• ${lineText}`;
    if (tag === "li" && runs.length && !runs[0].text.startsWith("•")) {
      runs[0] = { ...runs[0], text: `• ${runs[0].text}` };
    }
    lines.push({
      text: lineText,
      sizeScale,
      bold: sizeScale > 1 || runs.some((r) => r.bold),
      italic: runs.some((r) => r.italic),
      quote,
      codeBlock,
      runs: runs.length ? runs : [{ text: lineText }],
    });
  }

  if (!lines.length) {
    const plain = richHtmlToPlainText(source);
    return plain
      ? plain.split("\n").map((t) => ({ text: t, sizeScale: 1, runs: [{ text: t }] }))
      : [{ text: "", sizeScale: 1, runs: [{ text: "" }] }];
  }
  return lines;
}

function parseInlineRuns(html: string): RichInlineRun[] {
  const runs: RichInlineRun[] = [];
  let bold = 0;
  let italic = 0;
  let underline = 0;
  let code = 0;
  let color: string | undefined;
  let href: string | undefined;

  const re =
    /<\/?(strong|b|em|i|u|code|span|a)(?:\s([^>]*))?\/?>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[1]?.toLowerCase();
    if (tag) {
      const closing = m[0].startsWith("</");
      const attrs = m[2] || "";
      if (tag === "strong" || tag === "b") bold += closing ? -1 : 1;
      else if (tag === "em" || tag === "i") italic += closing ? -1 : 1;
      else if (tag === "u") underline += closing ? -1 : 1;
      else if (tag === "code") code += closing ? -1 : 1;
      else if (tag === "a") {
        if (closing) href = undefined;
        else {
          const hm = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
          href = hm?.[1];
        }
      } else if (tag === "span") {
        if (closing) color = undefined;
        else {
          const cm = attrs.match(/color\s*:\s*([^;"']+)/i) || attrs.match(/style\s*=\s*["'][^"']*color\s*:\s*([^;"']+)/i);
          color = cm?.[1]?.trim();
        }
      }
      continue;
    }
    const chunk = decodeEntities(m[3] || "");
    if (!chunk) continue;
    runs.push({
      text: chunk,
      bold: bold > 0,
      italic: italic > 0,
      underline: underline > 0,
      code: code > 0,
      color,
      href,
    });
  }
  if (!runs.length) {
    const plain = richHtmlToPlainText(html);
    if (plain) runs.push({ text: plain });
  }
  return runs;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

/** Allow TipTap-safe tags for canvas preview. */
export function sanitizeRichHtml(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}
