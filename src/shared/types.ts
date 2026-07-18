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
  | "stamp"
  | "formText"
  | "formCheck"
  | "formSelect";

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

export type FontFamily =
  | "Helvetica"
  | "Times-Roman"
  | "Courier"
  | "Inter"
  | "Roboto"
  | "OpenSans"
  | "Lora"
  | "Playfair"
  | string; // custom:<id>

export type ListStyle = "none" | "bullet" | "number";

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
  groupId?: string;
}

export interface TextElement extends PdfElementBase {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  underline: boolean;
  lineHeight: number;
  letterSpacing: number;
  listStyle: ListStyle;
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

export interface FormTextElement extends PdfElementBase {
  type: "formText";
  name: string;
  placeholder: string;
  multiline: boolean;
  fontSize: number;
  color: string;
  borderColor: string;
}

export interface FormCheckElement extends PdfElementBase {
  type: "formCheck";
  name: string;
  label: string;
  checked: boolean;
  color: string;
  fontSize: number;
}

export interface FormSelectElement extends PdfElementBase {
  type: "formSelect";
  name: string;
  options: string[];
  fontSize: number;
  color: string;
  borderColor: string;
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
  | StampElement
  | FormTextElement
  | FormCheckElement
  | FormSelectElement;

export interface PdfPage {
  id: string;
  elements: PdfElement[];
  applyMaster?: boolean;
  sourcePageIndex?: number;
}

export interface GuideLine {
  id: string;
  axis: "x" | "y";
  position: number;
}

export interface DocComment {
  id: string;
  pageId: string;
  x: number;
  y: number;
  body: string;
  author: string;
  resolved: boolean;
  createdAt: string;
}

export interface DocWatermark {
  type: "text" | "image";
  text?: string;
  src?: string;
  opacity: number;
  rotation: number;
  fontSize?: number;
  color?: string;
}

export interface DocMaster {
  header: PdfElement[];
  footer: PdfElement[];
}

export interface ImportedPdfRef {
  url: string;
  pageCount: number;
}

export interface PdfDocument {
  id: string;
  name: string;
  pageSize: PageSize;
  pageBackground: string;
  showGrid?: boolean;
  pages: PdfPage[];
  updatedAt: string;
  guides?: GuideLine[];
  master?: DocMaster;
  watermark?: DocWatermark | null;
  comments?: DocComment[];
  customFonts?: { id: string; name: string; url: string }[];
  importedPdf?: ImportedPdfRef | null;
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

export const GOOGLE_FONTS = [
  { id: "Inter", label: "Inter", css: "Inter, sans-serif" },
  { id: "Roboto", label: "Roboto", css: "Roboto, sans-serif" },
  { id: "OpenSans", label: "Open Sans", css: '"Open Sans", sans-serif' },
  { id: "Lora", label: "Lora", css: "Lora, serif" },
  { id: "Playfair", label: "Playfair Display", css: '"Playfair Display", serif' },
] as const;

export interface ExportSettings {
  margin: number;
  imageQuality: number;
  flatten: boolean;
  pdfaLite: boolean;
}

export interface ExportPayload {
  name: string;
  pageSize: PageSize;
  pageBackground?: string;
  pages: PdfPage[];
  master?: DocMaster;
  watermark?: DocWatermark | null;
  importedPdf?: ImportedPdfRef | null;
  customFonts?: { id: string; name: string; url: string }[];
  exportSettings?: ExportSettings;
}
