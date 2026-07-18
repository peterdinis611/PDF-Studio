import type {
  ArrowElement,
  BadgeElement,
  CheckboxElement,
  DividerElement,
  EllipseElement,
  IconElement,
  IconKind,
  ImageElement,
  LineElement,
  PdfDocument,
  PdfElement,
  PdfPage,
  RectElement,
  StampElement,
  StickyElement,
  TableElement,
  TextElement,
} from "../shared/types.js";

export function uid() {
  return crypto.randomUUID();
}

export function blankPage(): PdfPage {
  return { id: uid(), elements: [] };
}

export function defaultDoc(): PdfDocument {
  return {
    id: uid(),
    name: "Untitled document",
    pageSize: "a4",
    pageBackground: "#faf9f6",
    showGrid: false,
    pages: [blankPage()],
    updatedAt: new Date().toISOString(),
  };
}

export function createText(x: number, y: number, overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: uid(),
    type: "text",
    x,
    y,
    width: 220,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    content: "Double-click to edit",
    fontSize: 18,
    fontFamily: "Helvetica",
    fontWeight: "normal",
    color: "#1a1a1a",
    align: "left",
    ...overrides,
  };
}

export function createRect(x: number, y: number, overrides: Partial<RectElement> = {}): RectElement {
  return {
    id: uid(),
    type: "rect",
    x,
    y,
    width: 160,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: "#0d9488",
    stroke: "#0f766e",
    strokeWidth: 0,
    cornerRadius: 0,
    ...overrides,
  };
}

export function createEllipse(
  x: number,
  y: number,
  overrides: Partial<EllipseElement> = {},
): EllipseElement {
  return {
    id: uid(),
    type: "ellipse",
    x,
    y,
    width: 140,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: "#f59e0b",
    stroke: "#b45309",
    strokeWidth: 0,
    ...overrides,
  };
}

export function createLine(x: number, y: number, overrides: Partial<LineElement> = {}): LineElement {
  return {
    id: uid(),
    type: "line",
    x,
    y,
    width: 180,
    height: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    stroke: "#1a1a1a",
    strokeWidth: 2,
    ...overrides,
  };
}

export function createImage(
  x: number,
  y: number,
  data: { src: string; name: string; width: number; height: number },
): ImageElement {
  return {
    id: uid(),
    type: "image",
    x,
    y,
    width: data.width,
    height: data.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    src: data.src,
    name: data.name,
  };
}

export function createArrow(x: number, y: number, overrides: Partial<ArrowElement> = {}): ArrowElement {
  return {
    id: uid(),
    type: "arrow",
    x,
    y,
    width: 160,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    stroke: "#0f766e",
    strokeWidth: 3,
    headSize: 14,
    ...overrides,
  };
}

export function createSticky(x: number, y: number, overrides: Partial<StickyElement> = {}): StickyElement {
  return {
    id: uid(),
    type: "sticky",
    x,
    y,
    width: 160,
    height: 140,
    rotation: -2,
    opacity: 1,
    locked: false,
    content: "Note…",
    fill: "#fef08a",
    color: "#422006",
    fontSize: 14,
    ...overrides,
  };
}

export function createBadge(x: number, y: number, overrides: Partial<BadgeElement> = {}): BadgeElement {
  return {
    id: uid(),
    type: "badge",
    x,
    y,
    width: 120,
    height: 32,
    rotation: 0,
    opacity: 1,
    locked: false,
    label: "NEW",
    fill: "#0d9488",
    color: "#ffffff",
    fontSize: 12,
    ...overrides,
  };
}

export function createCheckbox(
  x: number,
  y: number,
  overrides: Partial<CheckboxElement> = {},
): CheckboxElement {
  return {
    id: uid(),
    type: "checkbox",
    x,
    y,
    width: 200,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    label: "Checklist item",
    checked: false,
    color: "#1a1a1a",
    fontSize: 14,
    ...overrides,
  };
}

export function createDivider(
  x: number,
  y: number,
  overrides: Partial<DividerElement> = {},
): DividerElement {
  return {
    id: uid(),
    type: "divider",
    x,
    y,
    width: 400,
    height: 8,
    rotation: 0,
    opacity: 1,
    locked: false,
    stroke: "#94a3b8",
    strokeWidth: 2,
    style: "solid",
    ...overrides,
  };
}

export function createIcon(
  x: number,
  y: number,
  icon: IconKind = "star",
  overrides: Partial<IconElement> = {},
): IconElement {
  return {
    id: uid(),
    type: "icon",
    x,
    y,
    width: 48,
    height: 48,
    rotation: 0,
    opacity: 1,
    locked: false,
    icon,
    color: "#0d9488",
    ...overrides,
  };
}

export function createTable(x: number, y: number, overrides: Partial<TableElement> = {}): TableElement {
  const rows = overrides.rows ?? 3;
  const cols = overrides.cols ?? 3;
  const cells =
    overrides.cells ??
    Array.from({ length: rows * cols }, (_, i) =>
      i < cols ? `Header ${i + 1}` : `Cell ${i - cols + 1}`,
    );

  return {
    id: uid(),
    type: "table",
    x,
    y,
    width: 420,
    height: 120,
    rotation: 0,
    opacity: 1,
    locked: false,
    header: true,
    fill: "#ffffff",
    headerFill: "#0f766e",
    stroke: "#cbd5e1",
    color: "#1a1a1a",
    fontSize: 11,
    ...overrides,
    rows,
    cols,
    cells,
  };
}

export function createStamp(x: number, y: number, overrides: Partial<StampElement> = {}): StampElement {
  return {
    id: uid(),
    type: "stamp",
    x,
    y,
    width: 140,
    height: 140,
    rotation: -12,
    opacity: 0.85,
    locked: false,
    label: "APPROVED",
    color: "#dc2626",
    fontSize: 16,
    ...overrides,
  };
}

export function cloneElement(el: PdfElement, offset = 16): PdfElement {
  const copy = structuredClone(el) as PdfElement;
  copy.id = uid();
  copy.x += offset;
  copy.y += offset;
  copy.locked = false;
  return copy;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function elementLabel(el: PdfElement): string {
  switch (el.type) {
    case "text":
      return el.content.slice(0, 24) || "Text";
    case "image":
      return el.name || "Image";
    case "sticky":
      return el.content.slice(0, 24) || "Sticky";
    case "badge":
      return el.label || "Badge";
    case "checkbox":
      return el.label.slice(0, 24) || "Checkbox";
    case "stamp":
      return el.label || "Stamp";
    case "icon":
      return el.icon;
    case "table":
      return `Table ${el.rows}×${el.cols}`;
    default:
      return el.type.charAt(0).toUpperCase() + el.type.slice(1);
  }
}
