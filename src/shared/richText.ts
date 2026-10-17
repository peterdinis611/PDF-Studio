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
<h3>Subsection</h3>
<p>Keep editing with the TipTap toolbar — H1 / H2 / H3 included.</p>`;

export type RichStyledLine = {
  text: string;
  sizeScale: number;
  bold?: boolean;
  italic?: boolean;
};

/** Strip tags for thumbnails / labels. */
export function richHtmlToPlainText(html: string): string {
  return (html || "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
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
 * Lightweight HTML → styled lines for pdf-lib export (no DOM).
 * Supports h1–h3, p, strong/b, em/i, ul/ol/li, br.
 */
export function richHtmlToStyledLines(html: string): RichStyledLine[] {
  const source = (html || "").trim();
  if (!source) return [{ text: "", sizeScale: 1 }];

  const normalized = source
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "");

  const blockRe = /<(h([123])|p|li)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  const lines: RichStyledLine[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(normalized))) {
    const tag = match[1].toLowerCase();
    const level = match[2];
    const inner = match[3];
    let sizeScale = 1;
    if (tag === "h1" || level === "1") sizeScale = 1.75;
    else if (tag === "h2" || level === "2") sizeScale = 1.4;
    else if (tag === "h3" || level === "3") sizeScale = 1.2;

    const { text, bold, italic } = inlineFlags(inner);
    let lineText = text.replace(/\s+/g, " ").trim();
    if (tag === "li" && lineText) lineText = `• ${lineText}`;
    lines.push({
      text: lineText,
      sizeScale,
      bold: bold || sizeScale > 1,
      italic,
    });
  }

  if (!lines.length) {
    const plain = richHtmlToPlainText(source);
    return plain ? plain.split("\n").map((t) => ({ text: t, sizeScale: 1 })) : [{ text: "", sizeScale: 1 }];
  }
  return lines;
}

function inlineFlags(html: string): { text: string; bold: boolean; italic: boolean } {
  let bold = false;
  let italic = false;
  let text = "";
  const re = /<\/?(strong|b|em|i)\b[^>]*>|([^<]+)/gi;
  let boldDepth = 0;
  let italicDepth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[1]?.toLowerCase();
    if (tag) {
      const closing = m[0].startsWith("</");
      if (tag === "strong" || tag === "b") boldDepth += closing ? -1 : 1;
      if (tag === "em" || tag === "i") italicDepth += closing ? -1 : 1;
      continue;
    }
    const chunk = decodeEntities(m[2] || "");
    if (!chunk) continue;
    text += chunk;
    if (boldDepth > 0) bold = true;
    if (italicDepth > 0) italic = true;
  }
  if (!text) text = richHtmlToPlainText(html);
  return { text, bold, italic };
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
    .replace(/<\/?(?!\/?(?:p|h[1-3]|ul|ol|li|strong|b|em|i|br|blockquote|code|pre)\b)[a-zA-Z][^>]*>/g, "");
}
