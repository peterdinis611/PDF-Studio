import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

let activeEditor: Editor | null = null;
let activeElementId: string | null = null;

export function getActiveTipTap(): Editor | null {
  return activeEditor;
}

export function getActiveTipTapElementId(): string | null {
  return activeElementId;
}

export function mountTipTap(
  host: HTMLElement,
  content: string,
  elementId: string,
  onUpdate?: (html: string) => void,
): Editor {
  destroyTipTap();
  activeElementId = elementId;
  activeEditor = new Editor({
    element: host,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content?.trim() ? content : "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-hidden min-h-full",
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });
  queueMicrotask(() => activeEditor?.commands.focus("end"));
  return activeEditor;
}

/** Destroy active editor and return final HTML (or null if none). */
export function destroyTipTap(): string | null {
  if (!activeEditor) {
    activeElementId = null;
    return null;
  }
  const html = activeEditor.getHTML();
  activeEditor.destroy();
  activeEditor = null;
  activeElementId = null;
  return html;
}

export type RichHeadingLevel = 1 | 2 | 3;

export function tipTapToggleHeading(level: RichHeadingLevel): boolean {
  const ed = activeEditor;
  if (!ed) return false;
  return ed.chain().focus().toggleHeading({ level }).run();
}

export function tipTapToggleBold(): boolean {
  return activeEditor?.chain().focus().toggleBold().run() ?? false;
}

export function tipTapToggleItalic(): boolean {
  return activeEditor?.chain().focus().toggleItalic().run() ?? false;
}

export function tipTapToggleUnderline(): boolean {
  return activeEditor?.chain().focus().toggleUnderline().run() ?? false;
}

export function tipTapToggleBulletList(): boolean {
  return activeEditor?.chain().focus().toggleBulletList().run() ?? false;
}

export function tipTapToggleOrderedList(): boolean {
  return activeEditor?.chain().focus().toggleOrderedList().run() ?? false;
}

export function tipTapSetParagraph(): boolean {
  return activeEditor?.chain().focus().setParagraph().run() ?? false;
}

export function tipTapToggleBlockquote(): boolean {
  return activeEditor?.chain().focus().toggleBlockquote().run() ?? false;
}

export function tipTapToggleCode(): boolean {
  return activeEditor?.chain().focus().toggleCode().run() ?? false;
}

export function tipTapToggleCodeBlock(): boolean {
  return activeEditor?.chain().focus().toggleCodeBlock().run() ?? false;
}

export function tipTapSetTextAlign(align: "left" | "center" | "right"): boolean {
  return activeEditor?.chain().focus().setTextAlign(align).run() ?? false;
}

export function tipTapSetColor(color: string): boolean {
  return activeEditor?.chain().focus().setColor(color).run() ?? false;
}

export function tipTapSetLink(href: string): boolean {
  const ed = activeEditor;
  if (!ed) return false;
  if (!href.trim()) {
    return ed.chain().focus().extendMarkRange("link").unsetLink().run();
  }
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return ed.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

export function tipTapInsertTable(): boolean {
  return (
    activeEditor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run() ?? false
  );
}
