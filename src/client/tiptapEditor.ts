import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

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
    ],
    content: content?.trim() ? content : "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-none min-h-full",
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

export function tipTapToggleBulletList(): boolean {
  return activeEditor?.chain().focus().toggleBulletList().run() ?? false;
}

export function tipTapToggleOrderedList(): boolean {
  return activeEditor?.chain().focus().toggleOrderedList().run() ?? false;
}

export function tipTapSetParagraph(): boolean {
  return activeEditor?.chain().focus().setParagraph().run() ?? false;
}
