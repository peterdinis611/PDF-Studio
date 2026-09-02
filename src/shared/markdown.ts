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

export const MARKDOWN_SAMPLE = `# Welcome

Write **Markdown** in this block — headings, lists, and \`code\`.

- Bold and _italic_
- Safe by default ([TanStack Markdown](https://tanstack.com/markdown/latest))

> Tip: toggle Markdown off to edit as plain text.
`;
