export type PageSize = "a4" | "letter" | "square" | "a5" | "legal";

export type ElementType =
  | "text"
  | "rect"
  | "ellipse"
  | "line"
  | "image"
  | "arrow"
  | "sticky"
  | "badge"
  | "checkbox"
  | "divider"
  | "icon"
  | "table"
  | "stamp";

export type IconKind =
  | "star"
  | "heart"
  | "check"
  | "x"
  | "warning"
  | "info"
  | "mail"
  | "phone"
  | "pin"
  | "user";

export interface PdfElementBase {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
}

export interface TextElement extends PdfElementBase {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  fontWeight: "normal" | "bold";
  color: string;
  align: "left" | "center" | "right";
}

export interface RectElement extends PdfElementBase {
  type: "rect";
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface EllipseElement extends PdfElementBase {
  type: "ellipse";
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineElement extends PdfElementBase {
  type: "line";
  stroke: string;
  strokeWidth: number;
}

export interface ImageElement extends PdfElementBase {
  type: "image";
  src: string;
  name: string;
}

export interface ArrowElement extends PdfElementBase {
  type: "arrow";
  stroke: string;
  strokeWidth: number;
  headSize: number;
}

export interface StickyElement extends PdfElementBase {
  type: "sticky";
  content: string;
  fill: string;
  color: string;
  fontSize: number;
}

export interface BadgeElement extends PdfElementBase {
  type: "badge";
  label: string;
  fill: string;
  color: string;
  fontSize: number;
}

export interface CheckboxElement extends PdfElementBase {
  type: "checkbox";
  label: string;
  checked: boolean;
  color: string;
  fontSize: number;
}

export interface DividerElement extends PdfElementBase {
  type: "divider";
  stroke: string;
  strokeWidth: number;
  style: "solid" | "dashed";
}

export interface IconElement extends PdfElementBase {
  type: "icon";
  icon: IconKind;
  color: string;
}

export interface TableElement extends PdfElementBase {
  type: "table";
  rows: number;
  cols: number;
  cells: string[];
  header: boolean;
  fill: string;
  headerFill: string;
  stroke: string;
  color: string;
  fontSize: number;
}

export interface StampElement extends PdfElementBase {
  type: "stamp";
  label: string;
  color: string;
  fontSize: number;
}

export type PdfElement =
  | TextElement
  | RectElement
  | EllipseElement
  | LineElement
  | ImageElement
  | ArrowElement
  | StickyElement
  | BadgeElement
  | CheckboxElement
  | DividerElement
  | IconElement
  | TableElement
  | StampElement;

export interface PdfPage {
  id: string;
  elements: PdfElement[];
}

export interface PdfDocument {
  id: string;
  name: string;
  pageSize: PageSize;
  pageBackground: string;
  showGrid?: boolean;
  pages: PdfPage[];
  updatedAt: string;
}

export interface PageDimensions {
  width: number;
  height: number;
  label: string;
}

/** Points (1/72") used by PDF */
export const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  a4: { width: 595.28, height: 841.89, label: "A4" },
  a5: { width: 419.53, height: 595.28, label: "A5" },
  letter: { width: 612, height: 792, label: "US Letter" },
  legal: { width: 612, height: 1008, label: "Legal" },
  square: { width: 600, height: 600, label: "Square" },
};

export interface ExportPayload {
  name: string;
  pageSize: PageSize;
  pageBackground?: string;
  pages: PdfPage[];
}
