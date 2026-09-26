import { parseMarkdown } from "@tanstack/markdown/parser";
import { renderHtml } from "@tanstack/markdown/html";
import type { BlockNode, InlineNode, MarkdownDocument } from "@tanstack/markdown";

/** Safe HTML for canvas preview (TanStack escapes raw HTML / bad URLs). */
export function markdownToHtml(source: string): string {
  try {
    return renderHtml(source || "");
  } catch {
    return `<p>${escapeBasic(source || "")}</p>`;
  }
}

function escapeBasic(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineToText(nodes: InlineNode[]): string {
  let out = "";
  for (const n of nodes) {
    switch (n.type) {
      case "text":
        out += n.value;
        break;
      case "inlineCode":
        out += n.value;
        break;
      case "break":
        out += "\n";
        break;
      case "strong":
      case "emphasis":
      case "strike":
      case "link":
        out += inlineToText(n.children);
        break;
      case "image":
        out += n.alt || "";
        break;
      case "footnoteReference":
        out += `[${n.number}]`;
        break;
      default:
        break;
    }
  }
  return out;
}

function blocksToText(nodes: BlockNode[]): string[] {
  const lines: string[] = [];
  for (const n of nodes) {
    switch (n.type) {
      case "heading":
        lines.push(inlineToText(n.children));
        lines.push("");
        break;
      case "paragraph":
        lines.push(inlineToText(n.children));
        lines.push("");
        break;
      case "blockquote":
        lines.push(...blocksToText(n.children).map((l) => (l ? `> ${l}` : "")));
        break;
      case "code":
        lines.push(...n.value.split("\n"));
        lines.push("");
        break;
      case "thematicBreak":
        lines.push("———");
        lines.push("");
        break;
      case "list": {
        let i = n.start ?? 1;
        for (const item of n.items) {
          const check =
            item.checked === true ? "☑ " : item.checked === false ? "☐ " : "";
          const prefix = `${check}${n.ordered ? `${i++}. ` : "• "}`;
          const inner = blocksToText(item.children);
          if (!inner.length) {
            lines.push(prefix.trimEnd());
            continue;
          }
          lines.push(prefix + inner[0]);
          for (const rest of inner.slice(1)) {
            if (!rest) {
              lines.push("");
              continue;
            }
            lines.push("  " + rest);
          }
        }
        lines.push("");
        break;
      }
      case "table": {
        if (n.header?.length) {
          lines.push(n.header.map((c) => inlineToText(c.children)).join(" | "));
        }
        for (const row of n.rows) {
          lines.push(row.map((c) => inlineToText(c.children)).join(" | "));
        }
        lines.push("");
        break;
      }
      case "callout":
        lines.push(`[${n.kind}] ${n.title}`.trim());
        lines.push(...blocksToText(n.children));
        break;
      default:
        break;
    }
  }
  return lines;
}

/** Flatten Markdown to plain text for PDF export. */
export function markdownToPlainText(source: string): string {
  try {
    const doc: MarkdownDocument = parseMarkdown(source || "");
    return blocksToText(doc.children)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return source || "";
  }
}

/** One styled glyph run for rich PDF export. */
export type TextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

/** One visual line of styled runs (headings, lists, paragraphs). */
export type StyledLine = {
  runs: TextRun[];
  /** Heading level 1–6 → larger size on export. */
  headingLevel?: number;
};

function inlineToRuns(nodes: InlineNode[], style: { bold?: boolean; italic?: boolean; code?: boolean } = {}): TextRun[] {
  const runs: TextRun[] = [];
  const push = (text: string, extra: Partial<TextRun> = {}) => {
    if (!text) return;
    const last = runs[runs.length - 1];
    const next: TextRun = {
      text,
      bold: extra.bold ?? style.bold,
      italic: extra.italic ?? style.italic,
      code: extra.code ?? style.code,
    };
    if (
      last &&
      Boolean(last.bold) === Boolean(next.bold) &&
      Boolean(last.italic) === Boolean(next.italic) &&
      Boolean(last.code) === Boolean(next.code)
    ) {
      last.text += text;
      return;
    }
    runs.push(next);
  };

  for (const n of nodes) {
    switch (n.type) {
      case "text":
        push(n.value);
        break;
      case "inlineCode":
        push(n.value, { code: true });
        break;
      case "break":
        push("\n");
        break;
      case "strong":
        runs.push(...inlineToRuns(n.children, { ...style, bold: true }));
        break;
      case "emphasis":
        runs.push(...inlineToRuns(n.children, { ...style, italic: true }));
        break;
      case "strike":
        runs.push(...inlineToRuns(n.children, style));
        break;
      case "link":
        runs.push(...inlineToRuns(n.children, style));
        break;
      case "image":
        push(n.alt || "");
        break;
      case "footnoteReference":
        push(`[${n.number}]`);
        break;
      default:
        break;
    }
  }
  return runs;
}

function blocksToStyledLines(nodes: BlockNode[]): StyledLine[] {
  const lines: StyledLine[] = [];
  const blank = () => lines.push({ runs: [] });

  for (const n of nodes) {
    switch (n.type) {
      case "heading":
        lines.push({ runs: inlineToRuns(n.children), headingLevel: n.level });
        blank();
        break;
      case "paragraph":
        lines.push({ runs: inlineToRuns(n.children) });
        blank();
        break;
      case "blockquote":
        for (const inner of blocksToStyledLines(n.children)) {
          if (!inner.runs.length) {
            blank();
            continue;
          }
          lines.push({
            runs: [{ text: "> " }, ...inner.runs],
            headingLevel: inner.headingLevel,
          });
        }
        break;
      case "code":
        for (const row of n.value.split("\n")) {
          lines.push({ runs: [{ text: row, code: true }] });
        }
        blank();
        break;
      case "thematicBreak":
        lines.push({ runs: [{ text: "——" }] });
        blank();
        break;
      case "list": {
        let i = n.start ?? 1;
        for (const item of n.items) {
          const check =
            item.checked === true ? "☑ " : item.checked === false ? "☐ " : "";
          const prefix = `${check}${n.ordered ? `${i++}. ` : "• "}`;
          const inner = blocksToStyledLines(item.children);
          if (!inner.length) {
            lines.push({ runs: [{ text: prefix.trimEnd() }] });
            continue;
          }
          lines.push({
            runs: [{ text: prefix }, ...inner[0].runs],
            headingLevel: inner[0].headingLevel,
          });
          for (const rest of inner.slice(1)) {
            if (!rest.runs.length) {
              blank();
              continue;
            }
            lines.push({
              runs: [{ text: "  " }, ...rest.runs],
              headingLevel: rest.headingLevel,
            });
          }
        }
        blank();
        break;
      }
      case "table": {
        if (n.header?.length) {
          lines.push({
            runs: [{ text: n.header.map((c) => inlineToText(c.children)).join(" | "), bold: true }],
          });
        }
        for (const row of n.rows) {
          lines.push({
            runs: [{ text: row.map((c) => inlineToText(c.children)).join(" | ") }],
          });
        }
        blank();
        break;
      }
      case "callout":
        lines.push({
          runs: [{ text: `[${n.kind}] ${n.title}`.trim(), bold: true }],
        });
        lines.push(...blocksToStyledLines(n.children));
        break;
      default:
        break;
    }
  }
  return lines;
}

/**
 * Parse Markdown into styled lines for pdf-lib drawing (bold / italic / code / headings).
 * Falls back to a single plain line on parse error.
 */
export function markdownToStyledLines(source: string): StyledLine[] {
  try {
    const doc: MarkdownDocument = parseMarkdown(source || "");
    const lines = blocksToStyledLines(doc.children);
    // Trim trailing blank lines
    while (lines.length && !lines[lines.length - 1].runs.length) lines.pop();
    return lines.length ? lines : [{ runs: [{ text: "" }] }];
  } catch {
    return [{ runs: [{ text: source || "" }] }];
  }
}

export const MARKDOWN_SAMPLE = `# Welcome

Write **Markdown** in this block — headings, lists, and \`code\`.

- Bold and _italic_
- Safe by default ([TanStack Markdown](https://tanstack.com/markdown/latest))

> Tip: toggle Markdown off to edit as plain text.
`;
