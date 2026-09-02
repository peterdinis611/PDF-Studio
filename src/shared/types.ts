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
  | "signature"
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

export interface SignatureElement extends PdfElementBase {
  type: "signature";
  src: string;
  name: string;
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
  | SignatureElement
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
  pageCount: number;
  name?: string;
  /** True when the source PDF lives only in the open browser tab (not on disk). */
  ephemeral?: boolean;
  /** @deprecated Legacy server upload URL — unused for new imports. */
  url?: string;
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
  group: "iso-a" | "iso-b" | "iso-c" | "us" | "arch" | "photo" | "other";
}

/** Points (1/72") used by PDF — full ISO / US / Arch / photo set */
export const PAGE_SIZES = {
  // ISO A
  a0: { width: 2383.94, height: 3370.39, label: "A0", group: "iso-a" },
  a1: { width: 1683.78, height: 2383.94, label: "A1", group: "iso-a" },
  a2: { width: 1190.55, height: 1683.78, label: "A2", group: "iso-a" },
  a3: { width: 841.89, height: 1190.55, label: "A3", group: "iso-a" },
  a4: { width: 595.28, height: 841.89, label: "A4", group: "iso-a" },
  a5: { width: 419.53, height: 595.28, label: "A5", group: "iso-a" },
  a6: { width: 297.64, height: 419.53, label: "A6", group: "iso-a" },
  a7: { width: 209.76, height: 297.64, label: "A7", group: "iso-a" },
  a8: { width: 147.4, height: 209.76, label: "A8", group: "iso-a" },
  a9: { width: 104.88, height: 147.4, label: "A9", group: "iso-a" },
  a10: { width: 73.7, height: 104.88, label: "A10", group: "iso-a" },
  // ISO B
  b0: { width: 2834.65, height: 4008.19, label: "B0", group: "iso-b" },
  b1: { width: 2004.09, height: 2834.65, label: "B1", group: "iso-b" },
  b2: { width: 1417.32, height: 2004.09, label: "B2", group: "iso-b" },
  b3: { width: 1000.63, height: 1417.32, label: "B3", group: "iso-b" },
  b4: { width: 708.66, height: 1000.63, label: "B4", group: "iso-b" },
  b5: { width: 498.9, height: 708.66, label: "B5", group: "iso-b" },
  b6: { width: 354.33, height: 498.9, label: "B6", group: "iso-b" },
  b7: { width: 249.45, height: 354.33, label: "B7", group: "iso-b" },
  b8: { width: 175.75, height: 249.45, label: "B8", group: "iso-b" },
  b9: { width: 124.72, height: 175.75, label: "B9", group: "iso-b" },
  b10: { width: 87.87, height: 124.72, label: "B10", group: "iso-b" },
  // ISO C / envelopes
  c4: { width: 649.13, height: 918.43, label: "C4", group: "iso-c" },
  c5: { width: 459.21, height: 649.13, label: "C5", group: "iso-c" },
  c6: { width: 323.15, height: 459.21, label: "C6", group: "iso-c" },
  dl: { width: 311.81, height: 623.62, label: "DL", group: "iso-c" },
  // North America
  letter: { width: 612, height: 792, label: "Letter", group: "us" },
  legal: { width: 612, height: 1008, label: "Legal", group: "us" },
  tabloid: { width: 792, height: 1224, label: "Tabloid", group: "us" },
  ledger: { width: 1224, height: 792, label: "Ledger", group: "us" },
  executive: { width: 522, height: 756, label: "Executive", group: "us" },
  statement: { width: 396, height: 612, label: "Statement", group: "us" },
  folio: { width: 612, height: 936, label: "Folio", group: "us" },
  quarto: { width: 540, height: 720, label: "Quarto", group: "us" },
  governmentLetter: { width: 576, height: 756, label: "Government Letter", group: "us" },
  governmentLegal: { width: 612, height: 936, label: "Government Legal", group: "us" },
  juniorLegal: { width: 360, height: 576, label: "Junior Legal", group: "us" },
  // ANSI / Architectural
  archA: { width: 648, height: 864, label: "Arch A", group: "arch" },
  archB: { width: 864, height: 1296, label: "Arch B", group: "arch" },
  archC: { width: 1296, height: 1728, label: "Arch C", group: "arch" },
  archD: { width: 1728, height: 2592, label: "Arch D", group: "arch" },
  archE: { width: 2592, height: 3456, label: "Arch E", group: "arch" },
  // Photo & cards
  photo4x6: { width: 288, height: 432, label: '4 × 6"', group: "photo" },
  photo5x7: { width: 360, height: 504, label: '5 × 7"', group: "photo" },
  photo8x10: { width: 576, height: 720, label: '8 × 10"', group: "photo" },
  photo8x12: { width: 576, height: 864, label: '8 × 12"', group: "photo" },
  businessCard: { width: 252, height: 144, label: "Business card", group: "photo" },
  // Other
  square: { width: 600, height: 600, label: "Square", group: "other" },
  squareSmall: { width: 432, height: 432, label: 'Square (6")', group: "other" },
  widescreen: { width: 792, height: 445.5, label: "Widescreen 16:9", group: "other" },
  presentation: { width: 720, height: 540, label: "Presentation 4:3", group: "other" },
} as const satisfies Record<string, PageDimensions>;

export type PageSize = keyof typeof PAGE_SIZES;

const PAGE_SIZE_GROUP_LABELS: Record<PageDimensions["group"], string> = {
  "iso-a": "ISO A",
  "iso-b": "ISO B",
  "iso-c": "Envelopes (ISO C)",
  us: "North America",
  arch: "Architectural",
  photo: "Photo & cards",
  other: "Other",
};

const PAGE_SIZE_GROUP_ORDER: PageDimensions["group"][] = [
  "iso-a",
  "iso-b",
  "iso-c",
  "us",
  "arch",
  "photo",
  "other",
];

export const PAGE_SIZE_OPTIONS = (Object.keys(PAGE_SIZES) as PageSize[]).map((id) => ({
  id,
  label: PAGE_SIZES[id].label,
  group: PAGE_SIZES[id].group,
}));

export const PAGE_SIZE_GROUPS = PAGE_SIZE_GROUP_ORDER.map((group) => ({
  id: group,
  label: PAGE_SIZE_GROUP_LABELS[group],
  options: PAGE_SIZE_OPTIONS.filter((o) => o.group === group),
}));

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
  /** Base64 of the original PDF — sent only for export, never persisted. */
  importedPdfData?: string;
  customFonts?: { id: string; name: string; url: string }[];
  exportSettings?: ExportSettings;
}
