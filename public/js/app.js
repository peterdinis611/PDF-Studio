var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/shared/types.ts
var PAGE_SIZES = {
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
  photo4x6: { width: 288, height: 432, label: '4 \xD7 6"', group: "photo" },
  photo5x7: { width: 360, height: 504, label: '5 \xD7 7"', group: "photo" },
  photo8x10: { width: 576, height: 720, label: '8 \xD7 10"', group: "photo" },
  photo8x12: { width: 576, height: 864, label: '8 \xD7 12"', group: "photo" },
  businessCard: { width: 252, height: 144, label: "Business card", group: "photo" },
  // Other
  square: { width: 600, height: 600, label: "Square", group: "other" },
  squareSmall: { width: 432, height: 432, label: 'Square (6")', group: "other" },
  widescreen: { width: 792, height: 445.5, label: "Widescreen 16:9", group: "other" },
  presentation: { width: 720, height: 540, label: "Presentation 4:3", group: "other" }
};
var PAGE_SIZE_GROUP_LABELS = {
  "iso-a": "ISO A",
  "iso-b": "ISO B",
  "iso-c": "Envelopes (ISO C)",
  us: "North America",
  arch: "Architectural",
  photo: "Photo & cards",
  other: "Other"
};
var PAGE_SIZE_GROUP_ORDER = [
  "iso-a",
  "iso-b",
  "iso-c",
  "us",
  "arch",
  "photo",
  "other"
];
var PAGE_SIZE_OPTIONS = Object.keys(PAGE_SIZES).map((id) => ({
  id,
  label: PAGE_SIZES[id].label,
  group: PAGE_SIZES[id].group
}));
var PAGE_SIZE_GROUPS = PAGE_SIZE_GROUP_ORDER.map((group) => ({
  id: group,
  label: PAGE_SIZE_GROUP_LABELS[group],
  options: PAGE_SIZE_OPTIONS.filter((o) => o.group === group)
}));
var GOOGLE_FONTS = [
  { id: "Inter", label: "Inter", css: "Inter, sans-serif" },
  { id: "Roboto", label: "Roboto", css: "Roboto, sans-serif" },
  { id: "OpenSans", label: "Open Sans", css: '"Open Sans", sans-serif' },
  { id: "Lora", label: "Lora", css: "Lora, serif" },
  { id: "Playfair", label: "Playfair Display", css: '"Playfair Display", serif' }
];

// src/client/factories.ts
function uid() {
  return crypto.randomUUID();
}
function blankPage() {
  return { id: uid(), elements: [] };
}
function defaultDoc() {
  return {
    id: uid(),
    name: "Untitled document",
    pageSize: "a4",
    pageBackground: "#faf9f6",
    showGrid: false,
    pages: [blankPage()],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createText(x, y, overrides = {}) {
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
    fontStyle: "normal",
    underline: false,
    lineHeight: 1.25,
    letterSpacing: 0,
    listStyle: "none",
    color: "#1a1a1a",
    align: "left",
    ...overrides
  };
}
function createRect(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createEllipse(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createLine(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createImage(x, y, data) {
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
    name: data.name
  };
}
function createSignature(x, y, data) {
  return {
    id: uid(),
    type: "signature",
    x,
    y,
    width: data.width,
    height: data.height,
    rotation: 0,
    opacity: 1,
    locked: false,
    src: data.src,
    name: data.name
  };
}
function createArrow(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createSticky(x, y, overrides = {}) {
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
    content: "Note\u2026",
    fill: "#fef08a",
    color: "#422006",
    fontSize: 14,
    ...overrides
  };
}
function createBadge(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createCheckbox(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createDivider(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createIcon(x, y, icon = "star", overrides = {}) {
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
    ...overrides
  };
}
function createTable(x, y, overrides = {}) {
  const rows = overrides.rows ?? 3;
  const cols = overrides.cols ?? 3;
  const cells = overrides.cells ?? Array.from(
    { length: rows * cols },
    (_, i) => i < cols ? `Header ${i + 1}` : `Cell ${i - cols + 1}`
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
    cells
  };
}
function createStamp(x, y, overrides = {}) {
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
    ...overrides
  };
}
function createFormText(x, y, overrides = {}) {
  return {
    id: uid(),
    type: "formText",
    x,
    y,
    width: 200,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    name: `field_${uid().slice(0, 8)}`,
    placeholder: "Enter text\u2026",
    multiline: false,
    fontSize: 12,
    color: "#1a1a1a",
    borderColor: "#94a3b8",
    ...overrides
  };
}
function createFormCheck(x, y, overrides = {}) {
  return {
    id: uid(),
    type: "formCheck",
    x,
    y,
    width: 180,
    height: 24,
    rotation: 0,
    opacity: 1,
    locked: false,
    name: `check_${uid().slice(0, 8)}`,
    label: "Option",
    checked: false,
    color: "#1a1a1a",
    fontSize: 12,
    ...overrides
  };
}
function createFormSelect(x, y, overrides = {}) {
  return {
    id: uid(),
    type: "formSelect",
    x,
    y,
    width: 180,
    height: 28,
    rotation: 0,
    opacity: 1,
    locked: false,
    name: `select_${uid().slice(0, 8)}`,
    options: ["Option A", "Option B", "Option C"],
    fontSize: 12,
    color: "#1a1a1a",
    borderColor: "#94a3b8",
    ...overrides
  };
}
function cloneElement(el, offset = 16) {
  const copy = structuredClone(el);
  copy.id = uid();
  copy.x += offset;
  copy.y += offset;
  copy.locked = false;
  return copy;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function elementLabel(el) {
  switch (el.type) {
    case "text":
      return el.content.slice(0, 24) || "Text";
    case "image":
      return el.name || "Image";
    case "signature":
      return el.name || "Signature";
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
      return `Table ${el.rows}\xD7${el.cols}`;
    case "formText":
      return el.name || "Form text";
    case "formCheck":
      return el.label || "Form check";
    case "formSelect":
      return el.name || "Form select";
    default:
      return el.type.charAt(0).toUpperCase() + el.type.slice(1);
  }
}

// src/client/fonts.ts
var STANDARD_FONTS = [
  { id: "Helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif" },
  { id: "Times-Roman", label: "Times", css: '"Times New Roman", Times, serif' },
  { id: "Courier", label: "Courier", css: '"Courier New", Courier, monospace' }
];
function fontCssFamily(family) {
  const std = STANDARD_FONTS.find((f) => f.id === family);
  if (std) return std.css;
  const google = GOOGLE_FONTS.find((f) => f.id === family);
  if (google) return google.css;
  return STANDARD_FONTS[0].css;
}
function allFontOptions() {
  return [
    ...STANDARD_FONTS.map((f) => ({ id: f.id, label: f.label })),
    ...GOOGLE_FONTS.map((f) => ({ id: f.id, label: f.label }))
  ];
}

// src/client/history.ts
var MAX = 60;
var HistoryStack = class {
  constructor() {
    __publicField(this, "past", []);
    __publicField(this, "future", []);
    __publicField(this, "lastPushed", "");
  }
  reset(doc) {
    this.past = [];
    this.future = [];
    this.lastPushed = JSON.stringify(doc);
  }
  push(doc) {
    const snapshot = JSON.stringify(doc);
    if (snapshot === this.lastPushed) return;
    this.past.push(this.lastPushed);
    if (this.past.length > MAX) this.past.shift();
    this.future = [];
    this.lastPushed = snapshot;
  }
  undo(current) {
    if (!this.past.length) return null;
    this.future.push(JSON.stringify(current));
    const prev = this.past.pop();
    this.lastPushed = prev;
    return JSON.parse(prev);
  }
  redo(current) {
    if (!this.future.length) return null;
    this.past.push(JSON.stringify(current));
    const next = this.future.pop();
    this.lastPushed = next;
    return JSON.parse(next);
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
};

// src/client/icons.ts
var ICON_PATHS = {
  star: "M12 2l2.9 6.9L22 10l-5 4.5L18.2 22 12 18.2 5.8 22 7 14.5 2 10l7.1-1.1L12 2z",
  heart: "M12 21s-7-4.4-9.5-8.2C.4 9.5 2.2 5.5 6 5.5c2 0 3.4 1.1 4 2.2.6-1.1 2-2.2 4-2.2 3.8 0 5.6 4 3.5 7.3C19 16.6 12 21 12 21z",
  check: "M5 13l4 4L19 7",
  x: "M6 6l12 12M18 6L6 18",
  warning: "M12 3l10 18H2L12 3zm0 6v5m0 3h.01",
  info: "M12 3a9 9 0 100 18 9 9 0 000-18zm0 8v5m0-8h.01",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  phone: "M6.5 3h3l1.5 4-2 1.5a12 12 0 005.5 5.5L16 12.5l4 1.5v3A2 2 0 0118 19 14 14 0 015 6a2 2 0 011.5-3z",
  pin: "M12 22s7-5.2 7-12a7 7 0 10-14 0c0 6.8 7 12 7 12zm0-9a3 3 0 110-6 3 3 0 010 6z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14z"
};
function iconSvg(icon, color, size = 24) {
  const d = ICON_PATHS[icon] ?? ICON_PATHS.star;
  const strokeIcons = ["check", "x", "warning", "info", "mail"];
  if (strokeIcons.includes(icon)) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="${d}"/></svg>`;
}

// src/client/library.ts
var LIBRARY_CATEGORIES = [
  { id: "all", label: "All elements" },
  { id: "favorites", label: "Favorites" },
  { id: "recent", label: "Recent" },
  { id: "basics", label: "Basics" },
  { id: "shapes", label: "Shapes" },
  { id: "notes", label: "Notes" },
  { id: "presets", label: "Presets" },
  { id: "layout", label: "Layout" },
  { id: "forms", label: "Forms" },
  { id: "brand", label: "Brand" },
  { id: "data", label: "Data" },
  { id: "icons", label: "Icons" },
  { id: "stamps", label: "Stamps" }
];
var LIBRARY_ITEMS = [
  // Basics
  {
    id: "text",
    category: "basics",
    label: "Text",
    hint: "Editable paragraph",
    tags: ["text", "paragraph", "copy"],
    kind: "text",
    preview: "T"
  },
  {
    id: "image",
    category: "basics",
    label: "Image",
    hint: "Upload PNG/JPEG",
    tags: ["photo", "picture", "media"],
    kind: "image",
    preview: "\u{1F5BC}"
  },
  {
    id: "sign",
    category: "basics",
    label: "Signature",
    hint: "Draw, type, or upload",
    tags: ["sign", "signature", "ink"],
    kind: "signature",
    preview: "\u270D"
  },
  {
    id: "divider",
    category: "basics",
    label: "Divider",
    hint: "Horizontal rule",
    tags: ["line", "hr", "separator"],
    kind: "divider",
    preview: "\u2014"
  },
  {
    id: "divider-dash",
    category: "basics",
    label: "Dashed line",
    hint: "Dashed divider",
    tags: ["line", "dashed"],
    kind: "preset:divider-dash",
    preview: "- -"
  },
  {
    id: "divider-thick",
    category: "basics",
    label: "Thick rule",
    hint: "Bold separator",
    tags: ["line", "bold"],
    kind: "preset:divider-thick",
    preview: "\u2501\u2501"
  },
  {
    id: "spacer",
    category: "basics",
    label: "Spacer box",
    hint: "Invisible layout gap",
    tags: ["space", "gap"],
    kind: "preset:spacer",
    preview: "\u2195"
  },
  // Shapes
  {
    id: "rect",
    category: "shapes",
    label: "Rectangle",
    hint: "Filled box",
    tags: ["box", "shape"],
    kind: "rect",
    preview: "\u25AD"
  },
  {
    id: "ellipse",
    category: "shapes",
    label: "Ellipse",
    hint: "Circle / oval",
    tags: ["oval", "shape"],
    kind: "ellipse",
    preview: "\u25CB"
  },
  {
    id: "line",
    category: "shapes",
    label: "Line",
    hint: "Straight stroke",
    tags: ["stroke"],
    kind: "line",
    preview: "/"
  },
  {
    id: "arrow",
    category: "shapes",
    label: "Arrow",
    hint: "Directional arrow",
    tags: ["pointer", "direction"],
    kind: "arrow",
    preview: "\u2192"
  },
  {
    id: "arrow-down",
    category: "shapes",
    label: "Arrow down",
    hint: "Vertical arrow",
    tags: ["pointer"],
    kind: "preset:arrow-down",
    preview: "\u2193"
  },
  {
    id: "rounded",
    category: "shapes",
    label: "Rounded box",
    hint: "Soft corners",
    tags: ["card"],
    kind: "preset:rounded",
    preview: "\u25A2"
  },
  {
    id: "frame",
    category: "shapes",
    label: "Frame",
    hint: "Stroke only",
    tags: ["border"],
    kind: "preset:frame",
    preview: "\u25A1"
  },
  {
    id: "circle",
    category: "shapes",
    label: "Circle",
    hint: "Perfect circle",
    tags: ["dot"],
    kind: "preset:circle",
    preview: "\u25CF"
  },
  {
    id: "triangle",
    category: "shapes",
    label: "Accent wedge",
    hint: "Diagonal block",
    tags: ["shape"],
    kind: "preset:wedge",
    preview: "\u25E2"
  },
  {
    id: "shadow-card",
    category: "shapes",
    label: "Card block",
    hint: "Soft card surface",
    tags: ["card", "ui"],
    kind: "preset:card",
    preview: "\u25AD"
  },
  // Notes
  {
    id: "sticky",
    category: "notes",
    label: "Sticky note",
    hint: "Yellow memo",
    tags: ["note", "memo"],
    kind: "sticky",
    preview: "\u{1F5D2}"
  },
  {
    id: "sticky-pink",
    category: "notes",
    label: "Pink sticky",
    hint: "Soft pink note",
    tags: ["note"],
    kind: "preset:sticky-pink",
    preview: "\u{1F4DD}"
  },
  {
    id: "sticky-mint",
    category: "notes",
    label: "Mint sticky",
    hint: "Mint memo",
    tags: ["note"],
    kind: "preset:sticky-mint",
    preview: "\u{1F4D7}"
  },
  {
    id: "sticky-blue",
    category: "notes",
    label: "Blue sticky",
    hint: "Cool blue note",
    tags: ["note"],
    kind: "preset:sticky-blue",
    preview: "\u{1F4D8}"
  },
  {
    id: "badge",
    category: "notes",
    label: "Badge",
    hint: "Pill label",
    tags: ["chip", "tag"],
    kind: "badge",
    preview: "\u25CF"
  },
  {
    id: "checkbox",
    category: "notes",
    label: "Checkbox",
    hint: "Checklist row",
    tags: ["todo", "check"],
    kind: "checkbox",
    preview: "\u2611"
  },
  {
    id: "checkbox-done",
    category: "notes",
    label: "Checked item",
    hint: "Already done",
    tags: ["todo"],
    kind: "preset:checkbox-done",
    preview: "\u2713"
  },
  {
    id: "badge-sale",
    category: "notes",
    label: "Sale badge",
    hint: "Promo chip",
    tags: ["promo"],
    kind: "badge:SALE",
    preview: "%"
  },
  {
    id: "badge-new",
    category: "notes",
    label: "New badge",
    hint: "Highlight chip",
    tags: ["promo"],
    kind: "badge:NEW",
    preview: "N"
  },
  {
    id: "badge-vip",
    category: "notes",
    label: "VIP badge",
    hint: "Gold chip",
    tags: ["promo"],
    kind: "preset:badge-vip",
    preview: "\u2605"
  },
  {
    id: "badge-hot",
    category: "notes",
    label: "Hot badge",
    hint: "Attention chip",
    tags: ["promo"],
    kind: "preset:badge-hot",
    preview: "\u{1F525}"
  },
  // Presets — typography / content blocks
  {
    id: "heading",
    category: "presets",
    label: "Heading",
    hint: "Bold title",
    tags: ["title", "h1"],
    kind: "preset:heading",
    preview: "H"
  },
  {
    id: "subhead",
    category: "presets",
    label: "Subheading",
    hint: "Section title",
    tags: ["h2"],
    kind: "preset:subhead",
    preview: "h"
  },
  {
    id: "quote",
    category: "presets",
    label: "Quote",
    hint: "Pull quote block",
    tags: ["blockquote"],
    kind: "preset:quote",
    preview: "\u201C"
  },
  {
    id: "callout",
    category: "presets",
    label: "Callout",
    hint: "Accent tip box",
    tags: ["tip", "info"],
    kind: "preset:callout",
    preview: "!"
  },
  {
    id: "warning-box",
    category: "presets",
    label: "Warning box",
    hint: "Alert callout",
    tags: ["alert"],
    kind: "preset:warning-box",
    preview: "\u26A0"
  },
  {
    id: "caption",
    category: "presets",
    label: "Caption",
    hint: "Small muted text",
    tags: ["footnote"],
    kind: "preset:caption",
    preview: "c"
  },
  {
    id: "highlight",
    category: "presets",
    label: "Highlight bar",
    hint: "Accent strip",
    tags: ["marker"],
    kind: "preset:highlight",
    preview: "\u25AC"
  },
  {
    id: "footer",
    category: "presets",
    label: "Page footer",
    hint: "Footer line + text",
    tags: ["footer"],
    kind: "preset:footer",
    preview: "\u2310"
  },
  {
    id: "date",
    category: "presets",
    label: "Date stamp",
    hint: "Today\u2019s date",
    tags: ["date"],
    kind: "preset:date",
    preview: "\u{1F4C5}"
  },
  {
    id: "bullets",
    category: "presets",
    label: "Bullet list",
    hint: "3 bullet points",
    tags: ["list", "ul"],
    kind: "preset:bullets",
    preview: "\u2022"
  },
  {
    id: "numbers",
    category: "presets",
    label: "Numbered list",
    hint: "1\u20133 steps",
    tags: ["list", "ol"],
    kind: "preset:numbers",
    preview: "1."
  },
  {
    id: "cta",
    category: "presets",
    label: "CTA button",
    hint: "Call to action",
    tags: ["button", "cta"],
    kind: "preset:cta",
    preview: "\u2192"
  },
  {
    id: "signature-line",
    category: "presets",
    label: "Signature line",
    hint: "Blank sign-here line",
    tags: ["sign", "line"],
    kind: "preset:signature",
    preview: "___"
  },
  {
    id: "address",
    category: "presets",
    label: "Address block",
    hint: "Contact address",
    tags: ["address", "contact"],
    kind: "preset:address",
    preview: "\u2302"
  },
  // Layout
  {
    id: "header-bar",
    category: "layout",
    label: "Header bar",
    hint: "Full-width top band",
    tags: ["header", "banner"],
    kind: "preset:header-bar",
    preview: "\u25AC"
  },
  {
    id: "sidebar-band",
    category: "layout",
    label: "Side band",
    hint: "Left accent strip",
    tags: ["sidebar"],
    kind: "preset:sidebar-band",
    preview: "|"
  },
  {
    id: "two-col",
    category: "layout",
    label: "Two columns",
    hint: "Paired text blocks",
    tags: ["columns", "grid"],
    kind: "preset:two-col",
    preview: "\u25A5"
  },
  {
    id: "hero-title",
    category: "layout",
    label: "Hero title",
    hint: "Large cover title",
    tags: ["cover", "hero"],
    kind: "preset:hero-title",
    preview: "A"
  },
  {
    id: "page-number",
    category: "layout",
    label: "Page number",
    hint: "Centered folio",
    tags: ["page", "folio"],
    kind: "preset:page-number",
    preview: "#"
  },
  {
    id: "section-rule",
    category: "layout",
    label: "Section break",
    hint: "Title + rule",
    tags: ["section"],
    kind: "preset:section-rule",
    preview: "\xA7"
  },
  // Forms
  {
    id: "form-name",
    category: "forms",
    label: "Name field",
    hint: "Label + underline",
    tags: ["form", "input"],
    kind: "preset:form-name",
    preview: "_"
  },
  {
    id: "form-email",
    category: "forms",
    label: "Email field",
    hint: "Email underline",
    tags: ["form"],
    kind: "preset:form-email",
    preview: "@"
  },
  {
    id: "form-date",
    category: "forms",
    label: "Date field",
    hint: "Date underline",
    tags: ["form"],
    kind: "preset:form-date",
    preview: "/"
  },
  {
    id: "form-check-row",
    category: "forms",
    label: "Agree row",
    hint: "Consent checkbox",
    tags: ["form", "gdpr"],
    kind: "preset:form-check",
    preview: "\u2610"
  },
  {
    id: "rating",
    category: "forms",
    label: "Star rating",
    hint: "5-star score",
    tags: ["rating", "stars"],
    kind: "preset:rating",
    preview: "\u2605\u2605"
  },
  {
    id: "progress",
    category: "forms",
    label: "Progress bar",
    hint: "70% filled bar",
    tags: ["progress", "meter"],
    kind: "preset:progress",
    preview: "\u25B0"
  },
  {
    id: "qr-box",
    category: "forms",
    label: "QR placeholder",
    hint: "Square QR frame",
    tags: ["qr", "code"],
    kind: "preset:qr",
    preview: "\u25A3"
  },
  // Brand
  {
    id: "logo-mark",
    category: "brand",
    label: "Logo mark",
    hint: "Round brand mark",
    tags: ["logo", "brand"],
    kind: "preset:logo-mark",
    preview: "PS"
  },
  {
    id: "brand-name",
    category: "brand",
    label: "Brand name",
    hint: "Company title",
    tags: ["logo", "name"],
    kind: "preset:brand-name",
    preview: "Aa"
  },
  {
    id: "tagline",
    category: "brand",
    label: "Tagline",
    hint: "Short slogan",
    tags: ["slogan"],
    kind: "preset:tagline",
    preview: "\u2026"
  },
  {
    id: "watermark",
    category: "brand",
    label: "Watermark",
    hint: "Faded diagonal text",
    tags: ["watermark"],
    kind: "preset:watermark",
    preview: "WM"
  },
  {
    id: "color-swatch",
    category: "brand",
    label: "Color swatches",
    hint: "3 brand colors",
    tags: ["palette"],
    kind: "preset:swatches",
    preview: "\u25D0"
  },
  // Data
  {
    id: "table",
    category: "data",
    label: "Table 3\xD73",
    hint: "Simple grid",
    tags: ["table"],
    kind: "table",
    preview: "\u25A6"
  },
  {
    id: "table-wide",
    category: "data",
    label: "Table 4\xD75",
    hint: "Wider grid",
    tags: ["table"],
    kind: "preset:table-wide",
    preview: "\u25A6"
  },
  {
    id: "table-invoice",
    category: "data",
    label: "Invoice lines",
    hint: "Desc / Qty / Price",
    tags: ["invoice", "table"],
    kind: "preset:table-invoice",
    preview: "\u25A4"
  },
  {
    id: "price-row",
    category: "data",
    label: "Price row",
    hint: "Label + amount",
    tags: ["price"],
    kind: "preset:price-row",
    preview: "\u20AC"
  },
  {
    id: "totals",
    category: "data",
    label: "Totals block",
    hint: "Subtotal / tax / total",
    tags: ["invoice", "sum"],
    kind: "preset:totals",
    preview: "\u03A3"
  },
  {
    id: "kpi",
    category: "data",
    label: "KPI card",
    hint: "Big number + label",
    tags: ["metric", "stat"],
    kind: "preset:kpi",
    preview: "42"
  },
  {
    id: "timeline",
    category: "data",
    label: "Timeline step",
    hint: "Step marker + text",
    tags: ["timeline"],
    kind: "preset:timeline",
    preview: "\u2460"
  },
  // Icons
  {
    id: "icon-star",
    category: "icons",
    label: "Star",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:star",
    preview: "\u2605"
  },
  {
    id: "icon-heart",
    category: "icons",
    label: "Heart",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:heart",
    preview: "\u2665"
  },
  {
    id: "icon-check",
    category: "icons",
    label: "Check",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:check",
    preview: "\u2713"
  },
  {
    id: "icon-x",
    category: "icons",
    label: "Close",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:x",
    preview: "\u2715"
  },
  {
    id: "icon-warn",
    category: "icons",
    label: "Warning",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:warning",
    preview: "!"
  },
  {
    id: "icon-info",
    category: "icons",
    label: "Info",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:info",
    preview: "i"
  },
  {
    id: "icon-mail",
    category: "icons",
    label: "Mail",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:mail",
    preview: "@"
  },
  {
    id: "icon-phone",
    category: "icons",
    label: "Phone",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:phone",
    preview: "\u260E"
  },
  {
    id: "icon-pin",
    category: "icons",
    label: "Pin",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:pin",
    preview: "\u{1F4CD}"
  },
  {
    id: "icon-user",
    category: "icons",
    label: "User",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:user",
    preview: "\u263A"
  },
  // Stamps
  {
    id: "stamp-ok",
    category: "stamps",
    label: "Approved",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:APPROVED",
    preview: "OK"
  },
  {
    id: "stamp-draft",
    category: "stamps",
    label: "Draft",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:DRAFT",
    preview: "DR"
  },
  {
    id: "stamp-paid",
    category: "stamps",
    label: "Paid",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:PAID",
    preview: "$"
  },
  {
    id: "stamp-conf",
    category: "stamps",
    label: "Confidential",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:CONFIDENTIAL",
    preview: "\u{1F512}"
  },
  {
    id: "stamp-urgent",
    category: "stamps",
    label: "Urgent",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:URGENT",
    preview: "!!"
  },
  {
    id: "stamp-copy",
    category: "stamps",
    label: "Copy",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:COPY",
    preview: "\xA9"
  },
  {
    id: "stamp-void",
    category: "stamps",
    label: "Void",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:VOID",
    preview: "\u2300"
  },
  {
    id: "stamp-sample",
    category: "stamps",
    label: "Sample",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:SAMPLE",
    preview: "SM"
  },
  {
    id: "stamp-final",
    category: "stamps",
    label: "Final",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:FINAL",
    preview: "FN"
  }
];
function createPreset(id, x, y) {
  switch (id) {
    case "divider-dash":
      return createDivider(x, y, { style: "dashed", stroke: "#64748b" });
    case "divider-thick":
      return createDivider(x, y, { strokeWidth: 5, stroke: "#1a1a1a", height: 12 });
    case "spacer":
      return createRect(x, y, {
        width: 200,
        height: 40,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        opacity: 0.35,
        cornerRadius: 4
      });
    case "rounded":
      return createRect(x, y, { cornerRadius: 16, fill: "#14b8a6", strokeWidth: 0 });
    case "frame":
      return createRect(x, y, {
        fill: "#ffffff",
        stroke: "#0f766e",
        strokeWidth: 2,
        cornerRadius: 4
      });
    case "circle":
      return createEllipse(x, y, { width: 120, height: 120, fill: "#0d9488" });
    case "wedge":
      return createRect(x, y, {
        width: 80,
        height: 180,
        fill: "#0f766e",
        strokeWidth: 0,
        rotation: -8
      });
    case "card":
      return createRect(x, y, {
        width: 280,
        height: 160,
        fill: "#ffffff",
        stroke: "#cbd5e1",
        strokeWidth: 1,
        cornerRadius: 12
      });
    case "arrow-down":
      return createArrow(x, y, { width: 20, height: 140, rotation: 90, stroke: "#0f766e" });
    case "sticky-pink":
      return createSticky(x, y, { fill: "#fbcfe8", color: "#831843" });
    case "sticky-mint":
      return createSticky(x, y, { fill: "#a7f3d0", color: "#064e3b" });
    case "sticky-blue":
      return createSticky(x, y, { fill: "#bfdbfe", color: "#1e3a8a" });
    case "checkbox-done":
      return createCheckbox(x, y, { checked: true, label: "Completed task" });
    case "badge-vip":
      return createBadge(x, y, { label: "VIP", fill: "#ca8a04", color: "#fffbeb" });
    case "badge-hot":
      return createBadge(x, y, { label: "HOT", fill: "#ea580c", color: "#fff7ed" });
    case "heading":
      return createText(x, y, {
        content: "Heading",
        fontSize: 32,
        fontWeight: "bold",
        width: 360,
        height: 44
      });
    case "subhead":
      return createText(x, y, {
        content: "Subheading",
        fontSize: 20,
        fontWeight: "bold",
        width: 320,
        height: 32
      });
    case "quote":
      return createText(x, y, {
        content: "\u201CA short pull quote that stands out on the page.\u201D",
        fontSize: 16,
        fontFamily: "Times-Roman",
        width: 360,
        height: 70,
        color: "#334155"
      });
    case "callout":
      return createRect(x, y, {
        width: 360,
        height: 72,
        fill: "#ecfdf5",
        stroke: "#0d9488",
        strokeWidth: 1.5,
        cornerRadius: 8
      });
    case "warning-box":
      return createRect(x, y, {
        width: 360,
        height: 72,
        fill: "#fff7ed",
        stroke: "#ea580c",
        strokeWidth: 1.5,
        cornerRadius: 8
      });
    case "caption":
      return createText(x, y, {
        content: "Figure caption or footnote",
        fontSize: 10,
        color: "#64748b",
        width: 280,
        height: 20
      });
    case "highlight":
      return createRect(x, y, {
        width: 420,
        height: 28,
        fill: "#fef08a",
        strokeWidth: 0,
        cornerRadius: 4
      });
    case "footer":
      return createText(x, y, {
        content: "Page footer \xB7 PDF Studio",
        fontSize: 10,
        color: "#94a3b8",
        width: 400,
        height: 18,
        align: "center"
      });
    case "date":
      return createText(x, y, {
        content: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        fontSize: 12,
        color: "#475569",
        width: 220,
        height: 22
      });
    case "bullets":
      return createText(x, y, {
        content: "\u2022 First highlight\n\u2022 Second highlight\n\u2022 Third highlight",
        fontSize: 13,
        width: 280,
        height: 80
      });
    case "numbers":
      return createText(x, y, {
        content: "1. Discover\n2. Design\n3. Deliver",
        fontSize: 13,
        width: 240,
        height: 80
      });
    case "cta":
      return createBadge(x, y, {
        label: "Get started \u2192",
        width: 160,
        height: 40,
        fontSize: 13,
        fill: "#0f766e"
      });
    case "signature":
      return createText(x, y, {
        content: "Signature: _______________________",
        fontSize: 12,
        width: 320,
        height: 24
      });
    case "address":
      return createText(x, y, {
        content: "Company Name\n123 Design Avenue\nBerlin, Germany",
        fontSize: 11,
        color: "#475569",
        width: 200,
        height: 60
      });
    case "header-bar":
      return createRect(x, y, {
        width: 595,
        height: 72,
        fill: "#0f766e",
        strokeWidth: 0,
        cornerRadius: 0
      });
    case "sidebar-band":
      return createRect(x, y, {
        width: 36,
        height: 842,
        fill: "#134e4a",
        strokeWidth: 0
      });
    case "two-col":
      return createText(x, y, {
        content: "Column A\nDetails go here.\n\nColumn B\nMore details.",
        fontSize: 12,
        width: 420,
        height: 110
      });
    case "hero-title":
      return createText(x, y, {
        content: "Your big idea",
        fontSize: 48,
        fontWeight: "bold",
        width: 480,
        height: 64
      });
    case "page-number":
      return createText(x, y, {
        content: "\u2014 1 \u2014",
        fontSize: 11,
        color: "#94a3b8",
        width: 80,
        height: 20,
        align: "center"
      });
    case "section-rule":
      return createText(x, y, {
        content: "SECTION 01  \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014",
        fontSize: 11,
        fontWeight: "bold",
        width: 480,
        height: 22,
        color: "#0f766e"
      });
    case "form-name":
      return createText(x, y, {
        content: "Full name\n________________________________",
        fontSize: 12,
        width: 320,
        height: 44
      });
    case "form-email":
      return createText(x, y, {
        content: "Email\n________________________________",
        fontSize: 12,
        width: 320,
        height: 44
      });
    case "form-date":
      return createText(x, y, {
        content: "Date\n____ / ____ / ________",
        fontSize: 12,
        width: 240,
        height: 44
      });
    case "form-check":
      return createCheckbox(x, y, {
        label: "I agree to the terms and conditions",
        width: 340
      });
    case "rating":
      return createText(x, y, {
        content: "\u2605\u2605\u2605\u2605\u2606  4.0",
        fontSize: 18,
        color: "#ca8a04",
        width: 160,
        height: 28
      });
    case "progress":
      return createRect(x, y, {
        width: 280,
        height: 16,
        fill: "#ccfbf1",
        stroke: "#0d9488",
        strokeWidth: 1,
        cornerRadius: 8
      });
    case "qr":
      return createRect(x, y, {
        width: 96,
        height: 96,
        fill: "#ffffff",
        stroke: "#1a1a1a",
        strokeWidth: 2,
        cornerRadius: 4
      });
    case "logo-mark":
      return createEllipse(x, y, {
        width: 64,
        height: 64,
        fill: "#0d9488",
        strokeWidth: 0
      });
    case "brand-name":
      return createText(x, y, {
        content: "PDF Studio",
        fontSize: 22,
        fontWeight: "bold",
        width: 200,
        height: 32
      });
    case "tagline":
      return createText(x, y, {
        content: "Design documents that feel finished.",
        fontSize: 12,
        color: "#64748b",
        width: 280,
        height: 24
      });
    case "watermark":
      return createText(x, y, {
        content: "DRAFT",
        fontSize: 64,
        fontWeight: "bold",
        color: "#94a3b8",
        opacity: 0.25,
        rotation: -24,
        width: 280,
        height: 70
      });
    case "swatches":
      return createRect(x, y, {
        width: 180,
        height: 40,
        fill: "#0d9488",
        strokeWidth: 0,
        cornerRadius: 6
      });
    case "table-wide":
      return createTable(x, y, {
        rows: 5,
        cols: 4,
        width: 480,
        height: 180,
        cells: Array.from(
          { length: 20 },
          (_, i) => i < 4 ? `Col ${i + 1}` : `R${Math.floor(i / 4)}C${i % 4 + 1}`
        )
      });
    case "table-invoice":
      return createTable(x, y, {
        rows: 4,
        cols: 3,
        width: 460,
        height: 140,
        cells: [
          "Description",
          "Qty",
          "Price",
          "Design services",
          "1",
          "\u20AC1,200",
          "Hosting",
          "1",
          "\u20AC240",
          "Support pack",
          "1",
          "\u20AC180"
        ]
      });
    case "price-row":
      return createText(x, y, {
        content: "Design package ........................ \u20AC890",
        fontSize: 13,
        width: 420,
        height: 24
      });
    case "totals":
      return createText(x, y, {
        content: "Subtotal          \u20AC1,620\nTax (19%)           \u20AC308\nTotal             \u20AC1,928",
        fontSize: 13,
        fontWeight: "bold",
        width: 220,
        height: 70,
        align: "right"
      });
    case "kpi":
      return createText(x, y, {
        content: "98%\nCustomer satisfaction",
        fontSize: 28,
        fontWeight: "bold",
        width: 200,
        height: 70,
        color: "#0f766e"
      });
    case "timeline":
      return createText(x, y, {
        content: "\u2460  Discovery call\n    Align goals and timeline",
        fontSize: 13,
        width: 260,
        height: 50
      });
    default:
      return createText(x, y);
  }
}
function createFromLibrary(kind, x, y) {
  if (kind === "image") return "image";
  if (kind === "signature") return "signature";
  if (kind === "text") return createText(x, y);
  if (kind === "rect") return createRect(x, y);
  if (kind === "ellipse") return createEllipse(x, y);
  if (kind === "line") return createLine(x, y);
  if (kind === "arrow") return createArrow(x, y);
  if (kind === "sticky") return createSticky(x, y);
  if (kind === "badge") return createBadge(x, y);
  if (kind === "checkbox") return createCheckbox(x, y);
  if (kind === "divider") return createDivider(x, y);
  if (kind === "table") return createTable(x, y);
  if (kind.startsWith("icon:")) {
    return createIcon(x, y, kind.slice(5));
  }
  if (kind.startsWith("badge:")) {
    const label = kind.slice(6);
    return createBadge(x, y, {
      label,
      fill: label === "NEW" ? "#2563eb" : "#e11d48"
    });
  }
  if (kind.startsWith("stamp:")) {
    const label = kind.slice(6);
    const colors = {
      APPROVED: "#16a34a",
      PAID: "#2563eb",
      URGENT: "#ea580c",
      COPY: "#475569",
      VOID: "#64748b",
      DRAFT: "#dc2626",
      CONFIDENTIAL: "#dc2626",
      SAMPLE: "#7c3aed",
      FINAL: "#0f766e"
    };
    return createStamp(x, y, {
      label,
      color: colors[label] ?? "#dc2626",
      fontSize: label.length > 8 ? 11 : 16
    });
  }
  if (kind.startsWith("preset:")) {
    return createPreset(kind.slice(7), x, y);
  }
  return createText(x, y);
}
function matchesLibraryQuery(item, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q) || item.category.includes(q) || item.tags.some((t) => t.includes(q));
}

// src/shared/session.ts
var SESSION_COOKIE = "pdf-studio-sid";
var SESSION_HEADER = "X-Pdf-Studio-Session";
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidSessionId(id) {
  return typeof id === "string" && UUID_RE.test(id);
}

// src/client/session.ts
var SESSION_STORAGE_KEY = "pdf-studio-session-id";
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!isValidSessionId(id)) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  document.cookie = `${SESSION_COOKIE}=${id}; path=/; SameSite=Lax`;
  return id;
}
function sessionStorageKey(base2) {
  return `pdf-studio:${getSessionId()}:${base2}`;
}
function storeGet(base2) {
  return localStorage.getItem(sessionStorageKey(base2));
}
function storeSet(base2, value) {
  localStorage.setItem(sessionStorageKey(base2), value);
}
function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers);
  headers.set(SESSION_HEADER, getSessionId());
  return fetch(input, { ...init, headers, credentials: "same-origin" });
}

// src/client/smartGuides.ts
var TOLERANCE = 4;
function computeSmartGuides(moving, siblings, pageWidth, pageHeight, excludeIds) {
  const targetsX = [0, pageWidth / 2, pageWidth];
  const targetsY = [0, pageHeight / 2, pageHeight];
  for (const el of siblings) {
    if (excludeIds.has(el.id)) continue;
    targetsX.push(el.x, el.x + el.width / 2, el.x + el.width);
    targetsY.push(el.y, el.y + el.height / 2, el.y + el.height);
  }
  const edgesX = [moving.x, moving.x + moving.width / 2, moving.x + moving.width];
  const edgesY = [moving.y, moving.y + moving.height / 2, moving.y + moving.height];
  let bestDx = 0;
  let bestDy = 0;
  let bestAbsDx = TOLERANCE + 1;
  let bestAbsDy = TOLERANCE + 1;
  let guideX = null;
  let guideY = null;
  for (const edge of edgesX) {
    for (const t of targetsX) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestAbsDx) {
        bestAbsDx = ad;
        bestDx = d;
        guideX = t;
      }
    }
  }
  for (const edge of edgesY) {
    for (const t of targetsY) {
      const d = t - edge;
      const ad = Math.abs(d);
      if (ad < bestAbsDy) {
        bestAbsDy = ad;
        bestDy = d;
        guideY = t;
      }
    }
  }
  const guides = [];
  let x = moving.x;
  let y = moving.y;
  if (bestAbsDx <= TOLERANCE && guideX !== null) {
    x += bestDx;
    guides.push({ axis: "x", position: guideX });
  }
  if (bestAbsDy <= TOLERANCE && guideY !== null) {
    y += bestDy;
    guides.push({ axis: "y", position: guideY });
  }
  return { x, y, guides };
}

// src/client/templates.ts
var TEMPLATE_LIST = [
  {
    id: "blank",
    name: "Blank A4",
    description: "Empty page to start from scratch"
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "Simple invoice with header and totals"
  },
  {
    id: "letter",
    name: "Letter",
    description: "Formal letter with sender and body"
  },
  {
    id: "flyer",
    name: "Flyer",
    description: "Bold promo flyer with accent block"
  },
  {
    id: "cv",
    name: "CV / Resume",
    description: "Professional resume with sidebar"
  },
  {
    id: "report",
    name: "Report",
    description: "One-page report with sections"
  },
  {
    id: "certificate",
    name: "Certificate",
    description: "Award certificate with border"
  },
  {
    id: "menu",
    name: "Menu",
    description: "Restaurant menu with courses"
  },
  {
    id: "proposal",
    name: "Proposal",
    description: "Project proposal overview"
  }
];
function base(name, pageSize = "a4") {
  return {
    id: uid(),
    name,
    pageSize,
    pageBackground: "#faf9f6",
    showGrid: false,
    pages: [blankPage()],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function invoiceTemplate() {
  const doc = base("Invoice");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 90, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 28, {
      content: "INVOICE",
      fontSize: 28,
      fontWeight: "bold",
      color: "#ffffff",
      width: 200,
      height: 36
    }),
    createText(360, 32, {
      content: "No. 00123\nDue: 30 days",
      fontSize: 12,
      color: "#ecfdf5",
      width: 180,
      height: 40,
      align: "right"
    }),
    createText(40, 120, {
      content: "Bill to\nAcme Corp\n123 Market Street\nBerlin",
      fontSize: 12,
      width: 220,
      height: 80
    }),
    createText(40, 230, {
      content: "Description                          Qty    Price",
      fontSize: 11,
      fontWeight: "bold",
      width: 500,
      height: 20
    }),
    createLine(40, 255, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 270, {
      content: "Design services                       1    \u20AC1,200\nHosting (annual)                      1      \u20AC240",
      fontSize: 12,
      width: 515,
      height: 50
    }),
    createLine(40, 340, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(340, 360, {
      content: "Subtotal          \u20AC1,440\nTax (19%)           \u20AC274\nTotal             \u20AC1,714",
      fontSize: 13,
      fontWeight: "bold",
      width: 215,
      height: 70,
      align: "right"
    }),
    createText(40, 760, {
      content: "Thank you for your business.",
      fontSize: 11,
      color: "#64748b",
      width: 300,
      height: 20
    })
  );
  return doc;
}
function letterTemplate() {
  const doc = base("Letter");
  const els = doc.pages[0].elements;
  els.push(
    createText(60, 60, {
      content: "Your Name\nyour@email.com\n+49 000 000000",
      fontSize: 11,
      color: "#475569",
      width: 220,
      height: 60
    }),
    createText(60, 160, {
      content: "Recipient Name\nCompany\nAddress line",
      fontSize: 12,
      width: 260,
      height: 60
    }),
    createText(60, 250, {
      content: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }),
      fontSize: 12,
      width: 260,
      height: 24
    }),
    createText(60, 300, {
      content: "Dear Recipient,",
      fontSize: 14,
      width: 400,
      height: 24
    }),
    createText(60, 340, {
      content: "I am writing to follow up on our recent conversation. Please find the details below and let me know if you have any questions.\n\nI look forward to hearing from you.",
      fontSize: 13,
      width: 475,
      height: 140
    }),
    createText(60, 520, {
      content: "Kind regards,\nYour Name",
      fontSize: 13,
      width: 260,
      height: 50
    })
  );
  return doc;
}
function flyerTemplate() {
  const doc = base("Flyer");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 842, fill: "#faf9f6", strokeWidth: 0 }),
    createRect(40, 40, {
      width: 515,
      height: 280,
      fill: "#0d9488",
      strokeWidth: 0,
      cornerRadius: 12
    }),
    createText(70, 100, {
      content: "Summer\nWorkshop",
      fontSize: 42,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 110
    }),
    createText(70, 230, {
      content: "Design systems \xB7 Live demos \xB7 Networking",
      fontSize: 14,
      color: "#ccfbf1",
      width: 420,
      height: 28
    }),
    createText(70, 380, {
      content: "Saturday 10:00 \xB7 Studio Hall",
      fontSize: 20,
      fontWeight: "bold",
      width: 420,
      height: 32
    }),
    createText(70, 430, {
      content: "Join us for a hands-on session on building polished PDFs and print layouts. Beginners welcome.",
      fontSize: 14,
      color: "#334155",
      width: 450,
      height: 70
    }),
    createRect(70, 540, {
      width: 180,
      height: 48,
      fill: "#1a1a1a",
      strokeWidth: 0,
      cornerRadius: 8
    }),
    createText(70, 552, {
      content: "Reserve a seat",
      fontSize: 16,
      fontWeight: "bold",
      color: "#ffffff",
      width: 180,
      height: 28,
      align: "center"
    })
  );
  return doc;
}
function cvTemplate() {
  const doc = base("CV / Resume");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 200, height: 842, fill: "#0f766e", strokeWidth: 0 }),
    createText(28, 48, {
      content: "Alex Morgan",
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      width: 150,
      height: 56
    }),
    createText(28, 110, {
      content: "Product Designer",
      fontSize: 12,
      color: "#ccfbf1",
      width: 150,
      height: 24
    }),
    createText(28, 160, {
      content: "CONTACT",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20
    }),
    createText(28, 185, {
      content: "alex@email.com\n+49 170 000000\nBerlin, DE\nlinkedin.com/in/alex",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 90
    }),
    createText(28, 300, {
      content: "SKILLS",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20
    }),
    createText(28, 325, {
      content: "UI / UX design\nFigma & prototyping\nDesign systems\nUser research\nHTML / CSS",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 110
    }),
    createText(28, 460, {
      content: "LANGUAGES",
      fontSize: 11,
      fontWeight: "bold",
      color: "#99f6e4",
      width: 150,
      height: 20
    }),
    createText(28, 485, {
      content: "English \u2014 Fluent\nGerman \u2014 Intermediate",
      fontSize: 11,
      color: "#ecfdf5",
      width: 150,
      height: 50
    }),
    createText(230, 48, {
      content: "Profile",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28
    }),
    createLine(230, 78, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 95, {
      content: "Product designer with 6+ years crafting clear interfaces and print-ready layouts. Focused on systems thinking and collaboration.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 70
    }),
    createText(230, 180, {
      content: "Experience",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28
    }),
    createLine(230, 210, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 225, {
      content: "Senior Designer \u2014 Studio North",
      fontSize: 13,
      fontWeight: "bold",
      width: 320,
      height: 22
    }),
    createText(230, 248, {
      content: "2021 \u2014 Present",
      fontSize: 11,
      color: "#64748b",
      width: 320,
      height: 18
    }),
    createText(230, 270, {
      content: "Led redesign of client portals and established a shared component library used across three products.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 55
    }),
    createText(230, 340, {
      content: "Designer \u2014 Bright Labs",
      fontSize: 13,
      fontWeight: "bold",
      width: 320,
      height: 22
    }),
    createText(230, 363, {
      content: "2018 \u2014 2021",
      fontSize: 11,
      color: "#64748b",
      width: 320,
      height: 18
    }),
    createText(230, 385, {
      content: "Designed marketing sites and onboarding flows. Partnered with engineers on accessible UI patterns.",
      fontSize: 12,
      color: "#334155",
      width: 320,
      height: 55
    }),
    createText(230, 460, {
      content: "Education",
      fontSize: 16,
      fontWeight: "bold",
      color: "#0f766e",
      width: 320,
      height: 28
    }),
    createLine(230, 490, { width: 320, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(230, 505, {
      content: "B.A. Visual Communication\nBerlin University of the Arts \u2014 2018",
      fontSize: 12,
      width: 320,
      height: 45
    })
  );
  return doc;
}
function reportTemplate() {
  const doc = base("Report");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 72, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 24, {
      content: "Quarterly Report",
      fontSize: 22,
      fontWeight: "bold",
      color: "#ffffff",
      width: 320,
      height: 32
    }),
    createText(380, 28, {
      content: "Q2 2026",
      fontSize: 14,
      color: "#ccfbf1",
      width: 170,
      height: 24,
      align: "right"
    }),
    createText(40, 100, {
      content: "Executive summary",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 130, {
      content: "Revenue grew 12% quarter over quarter. Retention improved after the onboarding redesign. Key risks remain around capacity and vendor costs.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 55
    }),
    createRect(40, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(50, 215, {
      content: "Revenue\n\u20AC248k\n+12% QoQ",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65
    }),
    createRect(220, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(230, 215, {
      content: "Customers\n1,420\n+8% QoQ",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65
    }),
    createRect(400, 200, {
      width: 155,
      height: 90,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(410, 215, {
      content: "NPS\n52\n+4 pts",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 135,
      height: 65
    }),
    createText(40, 320, {
      content: "Highlights",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createLine(40, 348, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 365, {
      content: "\u2022 Launched self-serve billing and reduced support tickets by 18%\n\u2022 Expanded team with two designers and one engineer\n\u2022 Pilot program with three enterprise accounts closed",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 70
    }),
    createText(40, 460, {
      content: "Next steps",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createLine(40, 488, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 505, {
      content: "1. Ship analytics dashboard for customer success\n2. Finalize Q3 hiring plan and budget\n3. Review vendor contracts before renewal",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 70
    }),
    createText(40, 780, {
      content: "Confidential \u2014 Internal use only",
      fontSize: 10,
      color: "#64748b",
      width: 515,
      height: 18
    })
  );
  return doc;
}
function certificateTemplate() {
  const doc = base("Certificate");
  const els = doc.pages[0].elements;
  els.push(
    createRect(28, 28, {
      width: 539,
      height: 786,
      fill: "#faf9f6",
      stroke: "#0f766e",
      strokeWidth: 3
    }),
    createRect(40, 40, {
      width: 515,
      height: 762,
      fill: "#faf9f6",
      stroke: "#0d9488",
      strokeWidth: 1
    }),
    createText(80, 120, {
      content: "CERTIFICATE OF COMPLETION",
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f766e",
      width: 435,
      height: 28,
      align: "center",
      letterSpacing: 2
    }),
    createLine(180, 160, { width: 235, height: 0, stroke: "#0d9488", strokeWidth: 2 }),
    createText(80, 200, {
      content: "This is to certify that",
      fontSize: 14,
      color: "#64748b",
      width: 435,
      height: 24,
      align: "center"
    }),
    createText(80, 250, {
      content: "Jordan Lee",
      fontSize: 36,
      fontWeight: "bold",
      color: "#1a1a1a",
      width: 435,
      height: 48,
      align: "center"
    }),
    createText(80, 320, {
      content: "has successfully completed the program\nPDF Design Fundamentals",
      fontSize: 15,
      color: "#334155",
      width: 435,
      height: 50,
      align: "center"
    }),
    createRect(200, 400, {
      width: 195,
      height: 8,
      fill: "#0d9488",
      strokeWidth: 0,
      cornerRadius: 4
    }),
    createText(80, 440, {
      content: "Awarded on 18 July 2026",
      fontSize: 13,
      color: "#475569",
      width: 435,
      height: 24,
      align: "center"
    }),
    createLine(90, 620, { width: 160, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(90, 635, {
      content: "Director\nAlex Morgan",
      fontSize: 12,
      color: "#475569",
      width: 160,
      height: 40,
      align: "center"
    }),
    createLine(345, 620, { width: 160, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(345, 635, {
      content: "Instructor\nSam Rivera",
      fontSize: 12,
      color: "#475569",
      width: 160,
      height: 40,
      align: "center"
    }),
    createText(80, 720, {
      content: "PDF Studio Academy",
      fontSize: 12,
      fontWeight: "bold",
      color: "#0f766e",
      width: 435,
      height: 24,
      align: "center"
    })
  );
  return doc;
}
function menuTemplate() {
  const doc = base("Menu");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 100, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 28, {
      content: "The Garden Table",
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 36
    }),
    createText(40, 68, {
      content: "Seasonal menu \xB7 Dinner",
      fontSize: 13,
      color: "#ccfbf1",
      width: 400,
      height: 22
    }),
    createText(40, 130, {
      content: "Starters",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28
    }),
    createLine(40, 160, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 180, {
      content: "Heirloom tomato salad",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 180, {
      content: "\u20AC12",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 202, {
      content: "Basil oil, aged balsamic, grilled sourdough",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 240, {
      content: "Soup of the day",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 240, {
      content: "\u20AC9",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 262, {
      content: "Ask your server for today's potage",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 320, {
      content: "Mains",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28
    }),
    createLine(40, 350, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 370, {
      content: "Herb-roasted chicken",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 370, {
      content: "\u20AC24",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 392, {
      content: "Lemon thyme jus, roasted roots, greens",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 430, {
      content: "Grilled sea bass",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 430, {
      content: "\u20AC28",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 452, {
      content: "Fennel salad, citrus beurre blanc",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 490, {
      content: "Mushroom risotto",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 490, {
      content: "\u20AC21",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 512, {
      content: "Porcini, parmesan, chives  \xB7  vegetarian",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 570, {
      content: "Desserts",
      fontSize: 18,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 28
    }),
    createLine(40, 600, { width: 515, height: 0, stroke: "#0d9488", strokeWidth: 1.5 }),
    createText(40, 620, {
      content: "Dark chocolate tart",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 620, {
      content: "\u20AC11",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 642, {
      content: "Sea salt caramel, whipped cream",
      fontSize: 11,
      color: "#64748b",
      width: 500,
      height: 20
    }),
    createText(40, 680, {
      content: "Seasonal fruit plate",
      fontSize: 13,
      fontWeight: "bold",
      width: 360,
      height: 22
    }),
    createText(430, 680, {
      content: "\u20AC9",
      fontSize: 13,
      fontWeight: "bold",
      width: 120,
      height: 22,
      align: "right"
    }),
    createText(40, 780, {
      content: "Please inform us of any allergies.",
      fontSize: 11,
      color: "#64748b",
      width: 515,
      height: 20
    })
  );
  return doc;
}
function proposalTemplate() {
  const doc = base("Proposal");
  const els = doc.pages[0].elements;
  els.push(
    createRect(0, 0, { width: 595, height: 110, fill: "#0f766e", strokeWidth: 0 }),
    createText(40, 30, {
      content: "Project Proposal",
      fontSize: 26,
      fontWeight: "bold",
      color: "#ffffff",
      width: 400,
      height: 36
    }),
    createText(40, 72, {
      content: "Website redesign for Acme Corp",
      fontSize: 14,
      color: "#ccfbf1",
      width: 400,
      height: 24
    }),
    createText(40, 140, {
      content: "Prepared for",
      fontSize: 11,
      fontWeight: "bold",
      color: "#0f766e",
      width: 240,
      height: 18
    }),
    createText(40, 160, {
      content: "Acme Corp\nJordan Lee, Marketing Lead",
      fontSize: 12,
      width: 240,
      height: 40
    }),
    createText(320, 140, {
      content: "Prepared by",
      fontSize: 11,
      fontWeight: "bold",
      color: "#0f766e",
      width: 230,
      height: 18
    }),
    createText(320, 160, {
      content: "PDF Studio\nAlex Morgan\n18 July 2026",
      fontSize: 12,
      width: 230,
      height: 55
    }),
    createLine(40, 230, { width: 515, height: 0, stroke: "#94a3b8", strokeWidth: 1 }),
    createText(40, 255, {
      content: "Overview",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 285, {
      content: "We propose a redesign of the marketing site to improve clarity, conversion, and brand consistency. Work includes discovery, wireframes, visual design, and handoff.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 60
    }),
    createText(40, 360, {
      content: "Scope",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 390, {
      content: "\u2022 Home, product, pricing, and about pages\n\u2022 Responsive layouts for desktop and mobile\n\u2022 Component library for future pages\n\u2022 Two rounds of revisions included",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 80
    }),
    createText(40, 490, {
      content: "Timeline & investment",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createRect(40, 525, {
      width: 250,
      height: 100,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(55, 545, {
      content: "Timeline\n6 weeks\nKickoff \u2192 launch",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 220,
      height: 70
    }),
    createRect(305, 525, {
      width: 250,
      height: 100,
      fill: "#ecfdf5",
      stroke: "#0d9488",
      strokeWidth: 1,
      cornerRadius: 8
    }),
    createText(320, 545, {
      content: "Investment\n\u20AC8,400\nFixed project fee",
      fontSize: 13,
      fontWeight: "bold",
      color: "#0f766e",
      width: 220,
      height: 70
    }),
    createText(40, 660, {
      content: "Next step",
      fontSize: 15,
      fontWeight: "bold",
      color: "#0f766e",
      width: 500,
      height: 24
    }),
    createText(40, 690, {
      content: "Approve this proposal and we will schedule a kickoff within five business days.",
      fontSize: 12,
      color: "#334155",
      width: 515,
      height: 40
    }),
    createText(40, 780, {
      content: "Valid for 30 days from the date above.",
      fontSize: 10,
      color: "#64748b",
      width: 515,
      height: 18
    })
  );
  return doc;
}
function buildTemplate(id) {
  switch (id) {
    case "invoice":
      return invoiceTemplate();
    case "letter":
      return letterTemplate();
    case "flyer":
      return flyerTemplate();
    case "cv":
      return cvTemplate();
    case "report":
      return reportTemplate();
    case "certificate":
      return certificateTemplate();
    case "menu":
      return menuTemplate();
    case "proposal":
      return proposalTemplate();
    default:
      return base("Untitled document");
  }
}

// src/client/main.ts
var STORAGE_KEY = "doc";
var DOCS_INDEX_KEY = "docs";
var THEME_KEY = "pdf-studio-theme";
var SETTINGS_KEY = "settings";
var FAV_KEY = "favorites";
var RECENT_KEY = "recent";
var BRAND_KEY = "brand";
var EXPORT_KEY = "export";
var AUTHOR_KEY = "author";
var docKey = (id) => `doc:${id}`;
function normalizeTextElement(el) {
  if (el.type !== "text") return el;
  const t = el;
  let fontFamily = t.fontFamily || "Helvetica";
  if (typeof fontFamily === "string" && fontFamily.startsWith("custom:")) {
    fontFamily = "Helvetica";
  }
  return {
    ...t,
    fontFamily,
    fontStyle: t.fontStyle ?? "normal",
    underline: t.underline ?? false,
    lineHeight: t.lineHeight ?? 1.25,
    letterSpacing: t.letterSpacing ?? 0,
    listStyle: t.listStyle ?? "none"
  };
}
function normalizeDoc(doc) {
  return {
    ...doc,
    pageBackground: doc.pageBackground || "#faf9f6",
    guides: doc.guides || [],
    comments: doc.comments || [],
    customFonts: doc.customFonts || [],
    master: doc.master || { header: [], footer: [] },
    watermark: doc.watermark ?? null,
    pages: doc.pages.map((p) => ({
      ...p,
      applyMaster: p.applyMaster !== false,
      elements: p.elements.map(normalizeTextElement)
    }))
  };
}
function trimSignatureCanvas(source) {
  const ctx = source.getContext("2d");
  if (!ctx) return source;
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < left || bottom < top) return source;
  const pad = Math.round(Math.min(width, height) * 0.04);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad);
  bottom = Math.min(height - 1, bottom + pad);
  const w = right - left + 1;
  const h = bottom - top + 1;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, left, top, w, h, 0, 0, w, h);
  return out;
}
function pdfEditor() {
  const history = new HistoryStack();
  let persistTimer = null;
  let skipHistory = false;
  let clipboard = [];
  let spaceDown = false;
  return {
    doc: defaultDoc(),
    activePageIndex: 0,
    selectedIds: [],
    tool: "select",
    zoom: 0.85,
    panX: 0,
    panY: 0,
    exporting: false,
    editingTextId: null,
    drag: null,
    smartGuides: [],
    marquee: null,
    showTemplates: false,
    showLibrary: true,
    leftRail: "insert",
    showExportModal: false,
    showSignatureModal: false,
    showFindReplace: false,
    showBrandKit: false,
    showDocLibrary: false,
    showComments: false,
    editingMaster: false,
    reviewMode: false,
    libraryCategory: "all",
    libraryItems: LIBRARY_ITEMS,
    libraryCategories: LIBRARY_CATEGORIES,
    libraryQuery: "",
    libraryView: "list",
    libraryKeepPlacing: false,
    favorites: [],
    recentIds: [],
    pendingLibraryKind: null,
    placeHint: false,
    signatureTab: "draw",
    signatureInk: "#1a1a1a",
    signatureTyped: "",
    signatureBusy: false,
    signatureHasInk: false,
    signaturePlace: null,
    signatureReplaceId: null,
    templates: TEMPLATE_LIST,
    snapEnabled: true,
    canUndo: false,
    canRedo: false,
    justInsertedId: null,
    theme: "dark",
    showSettings: false,
    showFileMenu: false,
    showGuides: false,
    showGrid: false,
    showRulers: true,
    fontOptions: allFontOptions(),
    findQuery: "",
    replaceQuery: "",
    findMatches: [],
    findIndex: -1,
    brand: {
      colors: ["#0d9488", "#0f766e", "#1a1a1a", "#faf9f6"],
      logoUrl: "",
      logoName: "",
      defaultFont: "Helvetica",
      name: "My Brand"
    },
    exportSettings: {
      margin: 0,
      imageQuality: 0.85,
      flatten: false,
      pdfaLite: false
    },
    authorName: "Reviewer",
    docLibrary: [],
    commentDraft: "",
    get selectedId() {
      return this.selectedIds[0] ?? null;
    },
    set selectedId(id) {
      this.selectedIds = id ? [id] : [];
    },
    get pageSize() {
      return PAGE_SIZES[this.doc.pageSize] ?? PAGE_SIZES.a4;
    },
    get activePage() {
      return this.doc.pages[this.activePageIndex] ?? this.doc.pages[0];
    },
    get selected() {
      if (!this.selectedIds.length) return null;
      return this.workingElements.find((e) => e.id === this.selectedIds[0]) ?? null;
    },
    get selectedElements() {
      return this.workingElements.filter((e) => this.selectedIds.includes(e.id));
    },
    get selectedIndex() {
      if (!this.selectedIds.length) return -1;
      return this.workingElements.findIndex((e) => e.id === this.selectedIds[0]);
    },
    get layers() {
      return [...this.workingElements].reverse().map((el) => ({
        id: el.id,
        label: elementLabel(el),
        type: el.type,
        locked: el.locked,
        groupId: el.groupId
      }));
    },
    get pageComments() {
      return (this.doc.comments || []).filter((c) => c.pageId === this.activePage.id);
    },
    get filteredLibrary() {
      let items = this.libraryItems;
      if (this.libraryCategory === "favorites") {
        items = items.filter((i) => this.favorites.includes(i.id));
      } else if (this.libraryCategory === "recent") {
        items = this.recentIds.map((id) => this.libraryItems.find((i) => i.id === id)).filter(Boolean);
      } else if (this.libraryCategory !== "all") {
        items = items.filter((i) => i.category === this.libraryCategory);
      }
      return items.filter((i) => matchesLibraryQuery(i, this.libraryQuery));
    },
    get pageStyle() {
      const { width, height } = this.pageSize;
      return {
        width: `${width * this.zoom}px`,
        height: `${height * this.zoom}px`,
        backgroundColor: this.doc.pageBackground || "#faf9f6",
        transform: `translate(${this.panX}px, ${this.panY}px)`
      };
    },
    get viewportStyle() {
      return {
        cursor: spaceDown || this.drag?.mode === "pan" ? "grab" : void 0
      };
    },
    get pageThumbStyle() {
      const { width, height } = this.pageSize;
      return { aspectRatio: `${width} / ${height}` };
    },
    get workingElements() {
      if (this.editingMaster) {
        return this.doc.master?.header || [];
      }
      return this.activePage.elements;
    },
    get displayElements() {
      return this.workingElements;
    },
    get masterPreviewElements() {
      if (this.editingMaster) return [];
      if (this.activePage.applyMaster === false) return [];
      return [...this.doc.master?.header || [], ...this.doc.master?.footer || []];
    },
    init() {
      getSessionId();
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get("template");
      const fresh = params.get("new") === "1";
      const openId = params.get("doc");
      const savedTheme = localStorage.getItem(THEME_KEY);
      this.theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : document.documentElement.getAttribute("data-theme") || "dark";
      this.applyTheme(this.theme);
      try {
        const settings = JSON.parse(storeGet(SETTINGS_KEY) || "{}");
        if (typeof settings.showGuides === "boolean") this.showGuides = settings.showGuides;
        if (typeof settings.showGrid === "boolean") this.showGrid = settings.showGrid;
        if (typeof settings.snapEnabled === "boolean") this.snapEnabled = settings.snapEnabled;
        if (typeof settings.showRulers === "boolean") this.showRulers = settings.showRulers;
      } catch {
      }
      try {
        this.favorites = JSON.parse(storeGet(FAV_KEY) || "[]");
        this.recentIds = JSON.parse(storeGet(RECENT_KEY) || "[]");
      } catch {
        this.favorites = [];
        this.recentIds = [];
      }
      try {
        const brand = JSON.parse(storeGet(BRAND_KEY) || "null");
        if (brand) this.brand = { ...this.brand, ...brand };
      } catch {
      }
      try {
        const exp = JSON.parse(storeGet(EXPORT_KEY) || "null");
        if (exp) this.exportSettings = { ...this.exportSettings, ...exp };
      } catch {
      }
      this.authorName = storeGet(AUTHOR_KEY) || "Reviewer";
      this.refreshDocLibrary();
      if (templateId) {
        this.doc = normalizeDoc(buildTemplate(templateId));
        this.commit(true);
      } else if (fresh) {
        this.doc = normalizeDoc(defaultDoc());
        this.commit(true);
      } else if (openId) {
        const saved = storeGet(docKey(openId));
        if (saved) {
          try {
            this.doc = normalizeDoc(JSON.parse(saved));
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        }
      } else {
        const saved = storeGet(STORAGE_KEY);
        if (saved) {
          try {
            this.doc = normalizeDoc(JSON.parse(saved));
          } catch {
            this.doc = normalizeDoc(defaultDoc());
          }
        } else {
          this.doc = normalizeDoc(defaultDoc());
        }
      }
      if (typeof this.doc.showGrid === "boolean") this.showGrid = this.doc.showGrid;
      this.fontOptions = allFontOptions();
      history.reset(this.doc);
      this.syncHistoryFlags();
      window.addEventListener("mousemove", (e) => this.onMouseMove(e));
      window.addEventListener("mouseup", () => this.onMouseUp());
      window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !e.target?.isContentEditable) {
          spaceDown = true;
        }
      });
      window.addEventListener("keyup", (e) => {
        if (e.code === "Space") spaceDown = false;
      });
      queueMicrotask(() => {
        const viewport = this.$el?.querySelector(
          ".canvas-workspace"
        );
        viewport?.addEventListener(
          "wheel",
          (e) => {
            const ev = e;
            if (ev.metaKey || ev.ctrlKey) {
              ev.preventDefault();
              this.onViewportWheel(ev);
            }
          },
          { passive: false }
        );
      });
    },
    applyTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    },
    toggleTheme() {
      this.applyTheme(this.theme === "dark" ? "light" : "dark");
    },
    saveSettings() {
      storeSet(
        SETTINGS_KEY,
        JSON.stringify({
          showGuides: this.showGuides,
          showGrid: this.showGrid,
          snapEnabled: this.snapEnabled,
          showRulers: this.showRulers
        })
      );
      this.doc.showGrid = this.showGrid;
      this.commit(false);
    },
    syncHistoryFlags() {
      this.canUndo = history.canUndo;
      this.canRedo = history.canRedo;
    },
    commit(recordHistory = true) {
      this.doc.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (recordHistory && !skipHistory) {
        history.push(this.doc);
        this.syncHistoryFlags();
      }
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        try {
          storeSet(STORAGE_KEY, JSON.stringify(this.doc));
          storeSet(docKey(this.doc.id), JSON.stringify(this.doc));
          this.upsertDocLibrary();
        } catch (err) {
          console.warn("Could not persist document", err);
        }
      }, 180);
    },
    persist() {
      this.commit(true);
    },
    persistSoft() {
      this.commit(false);
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(() => {
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        storeSet(docKey(this.doc.id), JSON.stringify(this.doc));
        this.upsertDocLibrary();
      }, 120);
    },
    refreshDocLibrary() {
      try {
        this.docLibrary = JSON.parse(storeGet(DOCS_INDEX_KEY) || "[]");
      } catch {
        this.docLibrary = [];
      }
    },
    upsertDocLibrary() {
      const entry = {
        id: this.doc.id,
        name: this.doc.name,
        updatedAt: this.doc.updatedAt
      };
      const list = this.docLibrary.filter((d) => d.id !== this.doc.id);
      list.unshift(entry);
      this.docLibrary = list.slice(0, 40);
      storeSet(DOCS_INDEX_KEY, JSON.stringify(this.docLibrary));
    },
    openDocFromLibrary(id) {
      const raw = storeGet(docKey(id));
      if (!raw) return;
      try {
        this.doc = normalizeDoc(JSON.parse(raw));
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.showDocLibrary = false;
        this.fontOptions = allFontOptions();
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      } catch {
        alert("Could not open document.");
      }
    },
    duplicateDocInLibrary() {
      const copy = structuredClone(this.doc);
      copy.id = uid();
      copy.name = `${this.doc.name} copy`;
      copy.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.doc = normalizeDoc(copy);
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },
    downloadStudioJson() {
      const blob = new Blob([JSON.stringify(this.doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdfstudio.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    async onStudioJsonSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        this.doc = normalizeDoc(JSON.parse(text));
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.fontOptions = allFontOptions();
        this.commit(false);
      } catch {
        alert("Invalid .pdfstudio.json file");
      } finally {
        input.value = "";
      }
    },
    undo() {
      const prev = history.undo(this.doc);
      if (!prev) return;
      skipHistory = true;
      this.doc = normalizeDoc(prev);
      this.selectedIds = [];
      this.syncHistoryFlags();
      storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },
    redo() {
      const next = history.redo(this.doc);
      if (!next) return;
      skipHistory = true;
      this.doc = normalizeDoc(next);
      this.selectedIds = [];
      this.syncHistoryFlags();
      storeSet(STORAGE_KEY, JSON.stringify(this.doc));
      skipHistory = false;
    },
    newDocument() {
      if (!confirm("Start a blank document? Unsaved changes stay in browser history only.")) return;
      this.doc = normalizeDoc(defaultDoc());
      this.activePageIndex = 0;
      this.selectedIds = [];
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },
    applyTemplate(id) {
      this.doc = normalizeDoc(buildTemplate(id));
      this.activePageIndex = 0;
      this.selectedIds = [];
      this.showTemplates = false;
      history.reset(this.doc);
      this.syncHistoryFlags();
      this.commit(false);
    },
    setActivePage(index) {
      this.activePageIndex = index;
      this.selectedIds = [];
      this.editingTextId = null;
    },
    addPage() {
      this.doc.pages.push(blankPage());
      this.activePageIndex = this.doc.pages.length - 1;
      this.selectedIds = [];
      this.commit();
    },
    duplicatePage(index) {
      const source = this.doc.pages[index];
      if (!source) return;
      const copy = {
        id: uid(),
        applyMaster: source.applyMaster,
        elements: source.elements.map((el) => {
          const c = structuredClone(el);
          c.id = uid();
          return c;
        })
      };
      this.doc.pages.splice(index + 1, 0, copy);
      this.activePageIndex = index + 1;
      this.selectedIds = [];
      this.commit();
    },
    movePage(index, dir) {
      const next = index + dir;
      if (next < 0 || next >= this.doc.pages.length) return;
      const pages = this.doc.pages;
      [pages[index], pages[next]] = [pages[next], pages[index]];
      this.activePageIndex = next;
      this.commit();
    },
    removePage(index) {
      if (this.doc.pages.length <= 1) return;
      this.doc.pages.splice(index, 1);
      this.activePageIndex = Math.min(this.activePageIndex, this.doc.pages.length - 1);
      this.selectedIds = [];
      this.commit();
    },
    zoomIn() {
      this.zoom = Math.min(2.5, Math.round((this.zoom + 0.1) * 10) / 10);
    },
    zoomOut() {
      this.zoom = Math.max(0.25, Math.round((this.zoom - 0.1) * 10) / 10);
    },
    fitWidth() {
      const pad = 160;
      const avail = Math.max(280, window.innerWidth - 420 - pad);
      this.zoom = Math.min(
        1.5,
        Math.max(0.3, Math.round(avail / this.pageSize.width * 100) / 100)
      );
      this.panX = 0;
      this.panY = 0;
    },
    fitPage() {
      const padX = 160;
      const padY = 180;
      const availW = Math.max(280, window.innerWidth - 420 - padX);
      const availH = Math.max(280, window.innerHeight - padY);
      const zx = availW / this.pageSize.width;
      const zy = availH / this.pageSize.height;
      this.zoom = Math.min(1.5, Math.max(0.3, Math.round(Math.min(zx, zy) * 100) / 100));
      this.panX = 0;
      this.panY = 0;
    },
    fitZoom() {
      this.fitWidth();
    },
    onViewportWheel(event) {
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      this.zoom = Math.min(2.5, Math.max(0.25, Math.round((this.zoom + delta) * 100) / 100));
    },
    pageCoords(event) {
      const page = this.$refs.page;
      const rect = page.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / this.zoom,
        y: (event.clientY - rect.top) / this.zoom
      };
    },
    snap(value) {
      if (!this.snapEnabled) return Math.round(value);
      const guides = this.doc.guides || [];
      for (const g of guides) {
        if (Math.abs(g.position - value) <= 4) return g.position;
      }
      return Math.round(value / 8) * 8;
    },
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
    selectElement(el, additive = false) {
      const groupMembers = el.groupId ? this.workingElements.filter((e) => e.groupId === el.groupId).map((e) => e.id) : [el.id];
      if (additive) {
        const set = new Set(this.selectedIds);
        for (const id of groupMembers) {
          if (set.has(id)) set.delete(id);
          else set.add(id);
        }
        this.selectedIds = [...set];
      } else {
        this.selectedIds = groupMembers;
      }
    },
    onCanvasBackground(event) {
      if (event.target === event.currentTarget) {
        if (spaceDown || event.button === 1) return;
        this.selectedIds = [];
        this.editingTextId = null;
      }
    },
    onViewportMouseDown(event) {
      if (event.button === 1 || event.button === 0 && spaceDown) {
        event.preventDefault();
        this.drag = {
          mode: "pan",
          startX: event.clientX,
          startY: event.clientY,
          origPanX: this.panX,
          origPanY: this.panY
        };
      }
    },
    onPageMouseDown(event) {
      if (event.button !== 0 || spaceDown) return;
      const { x, y } = this.pageCoords(event);
      const sx = this.snap(x);
      const sy = this.snap(y);
      if (this.tool === "comment" || this.reviewMode) {
        this.addCommentAt(sx, sy);
        return;
      }
      if (this.tool === "place" && this.pendingLibraryKind) {
        this.insertLibraryAt(this.pendingLibraryKind, sx, sy);
        return;
      }
      if (this.tool === "select") {
        this.drag = {
          mode: "marquee",
          startX: x,
          startY: y,
          x,
          y,
          w: 0,
          h: 0
        };
        if (!event.shiftKey) {
          this.selectedIds = [];
          this.editingTextId = null;
        }
        return;
      }
      let el;
      if (this.tool === "text")
        el = createText(sx, sy, { fontFamily: this.brand.defaultFont || "Helvetica" });
      else if (this.tool === "rect") el = createRect(sx, sy);
      else if (this.tool === "ellipse") el = createEllipse(sx, sy);
      else el = createLine(sx, sy);
      this.pushElement(el);
    },
    pushElement(el) {
      if (this.editingMaster) {
        if (!this.doc.master) this.doc.master = { header: [], footer: [] };
        this.doc.master.header.push(el);
      } else {
        this.activePage.elements.push(el);
      }
      this.selectedIds = [el.id];
      this.justInsertedId = el.id;
      if (!this.libraryKeepPlacing) {
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
      }
      this.commit();
      setTimeout(() => {
        if (this.justInsertedId === el.id) this.justInsertedId = null;
      }, 480);
      if (!this.libraryKeepPlacing && (el.type === "text" || el.type === "sticky")) {
        queueMicrotask(() => this.startTextEdit(el));
      }
    },
    rememberLibraryUse(item) {
      this.recentIds = [item.id, ...this.recentIds.filter((id) => id !== item.id)].slice(0, 16);
      storeSet(RECENT_KEY, JSON.stringify(this.recentIds));
    },
    isFavorite(id) {
      return this.favorites.includes(id);
    },
    toggleFavorite(id) {
      if (this.favorites.includes(id)) {
        this.favorites = this.favorites.filter((f) => f !== id);
      } else {
        this.favorites = [id, ...this.favorites].slice(0, 40);
      }
      storeSet(FAV_KEY, JSON.stringify(this.favorites));
    },
    pickLibraryItem(item) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        this.$refs.imageInput.click();
        return;
      }
      if (item.kind === "signature") {
        this.openSignatureModal();
        return;
      }
      this.pendingLibraryKind = item.kind;
      this.tool = "place";
      this.placeHint = true;
      this.selectedIds = [];
    },
    insertLibraryQuick(item) {
      this.rememberLibraryUse(item);
      if (item.kind === "image") {
        this.$refs.imageInput.click();
        return;
      }
      if (item.kind === "signature") {
        this.openSignatureModal();
        return;
      }
      const { width, height } = this.pageSize;
      const el = createFromLibrary(item.kind, width / 2 - 80, height / 2 - 40);
      if (el === "image" || el === "signature") return;
      el.x = this.snap(Math.max(24, width / 2 - el.width / 2));
      el.y = this.snap(Math.max(24, height / 2 - el.height / 2));
      this.pushElement(el);
    },
    insertLibraryAt(kind, x, y) {
      const el = createFromLibrary(kind, x, y);
      if (el === "image") {
        this.$refs.imageInput.click();
        return;
      }
      if (el === "signature") {
        this.openSignatureModal(x, y);
        return;
      }
      this.pushElement(el);
    },
    insertFormField(kind) {
      const { width, height } = this.pageSize;
      const x = this.snap(width / 2 - 90);
      const y = this.snap(height / 2 - 20);
      const el = kind === "formText" ? createFormText(x, y) : kind === "formCheck" ? createFormCheck(x, y) : createFormSelect(x, y);
      this.pushElement(el);
    },
    onElementMouseDown(event, el) {
      if (event.button !== 0 || spaceDown) return;
      if (this.editingMaster) {
      }
      this.selectElement(el, event.shiftKey);
      if (el.locked) return;
      const ids = this.selectedIds.filter((id) => {
        const e = this.workingElements.find((x) => x.id === id);
        return e && !e.locked;
      });
      this.drag = {
        mode: "move",
        ids,
        startX: event.clientX,
        startY: event.clientY,
        origins: ids.map((id) => {
          const e = this.workingElements.find((x) => x.id === id);
          return { id, x: e.x, y: e.y };
        })
      };
    },
    startResize(event, el) {
      if (el.locked) return;
      this.drag = {
        mode: "resize",
        id: el.id,
        startX: event.clientX,
        startY: event.clientY,
        origW: el.width,
        origH: el.height
      };
    },
    onMouseMove(event) {
      if (!this.drag) return;
      if (this.drag.mode === "pan") {
        this.panX = this.drag.origPanX + (event.clientX - this.drag.startX);
        this.panY = this.drag.origPanY + (event.clientY - this.drag.startY);
        return;
      }
      if (this.drag.mode === "marquee") {
        const { x, y } = this.pageCoords(event);
        const x0 = Math.min(this.drag.startX, x);
        const y0 = Math.min(this.drag.startY, y);
        const w = Math.abs(x - this.drag.startX);
        const h = Math.abs(y - this.drag.startY);
        this.drag = { ...this.drag, x: x0, y: y0, w, h };
        this.marquee = { x: x0, y: y0, w, h };
        return;
      }
      if (this.drag.mode === "guide") {
        const guideDrag = this.drag;
        const { x, y } = this.pageCoords(event);
        const g = (this.doc.guides || []).find((g2) => g2.id === guideDrag.id);
        if (g) {
          g.position = guideDrag.axis === "x" ? this.snap(x) : this.snap(y);
        }
        return;
      }
      if (this.drag.mode === "resize") {
        const resizeDrag = this.drag;
        const el = this.workingElements.find((e) => e.id === resizeDrag.id);
        if (!el) return;
        const dx = (event.clientX - resizeDrag.startX) / this.zoom;
        const dy = (event.clientY - resizeDrag.startY) / this.zoom;
        el.width = Math.max(20, this.snap(resizeDrag.origW + dx));
        el.height = Math.max(el.type === "line" ? 0 : 20, this.snap(resizeDrag.origH + dy));
        return;
      }
      if (this.drag.mode === "move") {
        const dx = (event.clientX - this.drag.startX) / this.zoom;
        const dy = (event.clientY - this.drag.startY) / this.zoom;
        const exclude = new Set(this.drag.ids);
        const primary = this.drag.origins[0];
        if (!primary) return;
        const primaryEl = this.workingElements.find((e) => e.id === primary.id);
        if (!primaryEl) return;
        let nx = this.snap(primary.x + dx);
        let ny = this.snap(primary.y + dy);
        if (this.snapEnabled) {
          const result = computeSmartGuides(
            { x: nx, y: ny, width: primaryEl.width, height: primaryEl.height },
            this.workingElements,
            this.pageSize.width,
            this.pageSize.height,
            exclude
          );
          nx = result.x;
          ny = result.y;
          this.smartGuides = result.guides;
        } else {
          this.smartGuides = [];
        }
        const odx = nx - primary.x;
        const ody = ny - primary.y;
        for (const origin of this.drag.origins) {
          const el = this.workingElements.find((e) => e.id === origin.id);
          if (!el || el.locked) continue;
          el.x = origin.x + odx;
          el.y = origin.y + ody;
        }
      }
    },
    onMouseUp() {
      if (!this.drag) return;
      if (this.drag.mode === "marquee") {
        const box = this.marquee;
        if (box && box.w > 4 && box.h > 4) {
          const hits = this.workingElements.filter(
            (el) => el.x < box.x + box.w && el.x + el.width > box.x && el.y < box.y + box.h && el.y + el.height > box.y
          ).map((el) => el.id);
          this.selectedIds = [.../* @__PURE__ */ new Set([...this.selectedIds, ...hits])];
        }
        this.marquee = null;
        this.drag = null;
        return;
      }
      if (this.drag.mode === "move" || this.drag.mode === "resize" || this.drag.mode === "guide") {
        this.drag = null;
        this.smartGuides = [];
        this.commit();
        return;
      }
      this.drag = null;
      this.smartGuides = [];
    },
    elementStyle(el) {
      const rotating = el.rotation ? `rotate(${el.rotation}deg)` : "";
      return {
        left: `${el.x * this.zoom}px`,
        top: `${el.y * this.zoom}px`,
        width: `${Math.max(el.width, 1) * this.zoom}px`,
        height: `${Math.max(el.height, el.type === "line" || el.type === "divider" || el.type === "arrow" ? 8 : 1) * this.zoom}px`,
        opacity: String(el.opacity),
        transform: rotating || void 0,
        cursor: el.locked ? "not-allowed" : this.tool === "place" ? "crosshair" : "move"
      };
    },
    iconHtml(el) {
      if (el.type !== "icon") return "";
      return iconSvg(el.icon, el.color, Math.min(el.width, el.height) * this.zoom);
    },
    previewText(content) {
      return content.replace(/\{\{page\}\}/g, String(this.activePageIndex + 1)).replace(/\{\{pages\}\}/g, String(this.doc.pages.length));
    },
    displayTextContent(el) {
      let content = this.previewText(el.content || "");
      if (el.listStyle === "bullet") {
        content = content.split("\n").map((l) => l.trim() ? `\u2022 ${l}` : l).join("\n");
      } else if (el.listStyle === "number") {
        let n = 1;
        content = content.split("\n").map((l) => l.trim() ? `${n++}. ${l}` : l).join("\n");
      }
      return content;
    },
    textInnerStyle(el) {
      return {
        fontSize: `${el.fontSize * this.zoom}px`,
        fontFamily: fontCssFamily(el.fontFamily),
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle || "normal",
        textDecoration: el.underline ? "underline" : "none",
        letterSpacing: `${(el.letterSpacing || 0) * this.zoom}px`,
        lineHeight: String(el.lineHeight || 1.25),
        color: el.color,
        textAlign: el.align
      };
    },
    shapeStyle(el) {
      const radius = el.type === "ellipse" ? "50%" : `${(el.cornerRadius || 0) * this.zoom}px`;
      return {
        backgroundColor: el.fill,
        border: el.strokeWidth > 0 ? `${el.strokeWidth * this.zoom}px solid ${el.stroke}` : "none",
        boxSizing: "border-box",
        borderRadius: radius
      };
    },
    thumbElementStyle(el) {
      return `left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${Math.max(el.height, 2)}px;opacity:${el.opacity};`;
    },
    thumbPreview(el) {
      if (el.type === "text" || el.type === "sticky") {
        return `<span style="font-size:${el.fontSize}px;color:${el.color};background:${el.type === "sticky" ? el.fill : "transparent"}">${escapeHtml(el.content.slice(0, 28))}</span>`;
      }
      if (el.type === "image" || el.type === "signature") {
        return `<img src="${el.src}" style="width:100%;height:100%;object-fit:contain" />`;
      }
      if (el.type === "line" || el.type === "divider" || el.type === "arrow") {
        return `<svg width="100%" height="100%" style="overflow:visible"><line x1="0" y1="50%" x2="100%" y2="50%" stroke="${"stroke" in el ? el.stroke : "#333"}" stroke-width="2"/></svg>`;
      }
      if (el.type === "badge" || el.type === "stamp") {
        return `<span style="color:${el.color};font-size:10px;font-weight:bold">${escapeHtml(el.label)}</span>`;
      }
      if (el.type === "checkbox" || el.type === "formCheck") {
        return `<span style="font-size:10px">${"checked" in el && el.checked ? "\u2611" : "\u2610"} ${escapeHtml(("label" in el ? el.label : "").slice(0, 16))}</span>`;
      }
      if (el.type === "formText" || el.type === "formSelect") {
        return `<span style="font-size:10px;border:1px solid #94a3b8;padding:2px">${escapeHtml(el.name)}</span>`;
      }
      if (el.type === "icon") {
        return iconSvg(el.icon, el.color, 16);
      }
      if (el.type === "table") {
        return `<div style="width:100%;height:100%;background:#e2e8f0;border:1px solid #94a3b8"></div>`;
      }
      if (el.type === "rect" || el.type === "ellipse") {
        const radius = el.type === "ellipse" ? "50%" : `${el.cornerRadius || 0}px`;
        return `<div style="width:100%;height:100%;background:${el.fill};border-radius:${radius}"></div>`;
      }
      return "";
    },
    startTextEdit(el) {
      this.editingTextId = el.id;
      this.selectedIds = [el.id];
    },
    finishTextEdit(event, el) {
      const target = event.target;
      el.content = target.innerText;
      this.editingTextId = null;
      this.commit();
    },
    updateTableCell(row, col, value) {
      const el = this.selected;
      if (!el || el.type !== "table") return;
      const idx = row * el.cols + col;
      el.cells[idx] = value;
      this.persistSoft();
    },
    copySelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      clipboard = els.map((el) => structuredClone(el));
      try {
        void navigator.clipboard.writeText(
          JSON.stringify({ type: "pdf-studio-elements", elements: clipboard })
        );
      } catch {
      }
    },
    cutSelected() {
      this.copySelected();
      this.deleteSelected();
    },
    pasteClipboard() {
      if (!clipboard.length) return;
      const copies = clipboard.map((el) => cloneElement(el, 20));
      for (const c of copies) {
        c.groupId = void 0;
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          this.doc.master.header.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },
    duplicateSelected() {
      const els = this.selectedElements;
      if (!els.length) return;
      const copies = els.map((el) => cloneElement(el));
      for (const c of copies) {
        if (this.editingMaster) {
          if (!this.doc.master) this.doc.master = { header: [], footer: [] };
          this.doc.master.header.push(c);
        } else {
          this.activePage.elements.push(c);
        }
      }
      this.selectedIds = copies.map((c) => c.id);
      this.commit();
    },
    deleteSelected() {
      if (!this.selectedIds.length) return;
      const locked = this.selectedElements.some((e) => e.locked);
      if (locked && this.selectedElements.every((e) => e.locked)) return;
      const remove = new Set(
        this.selectedIds.filter((id) => {
          const el = this.workingElements.find((e) => e.id === id);
          return el && !el.locked;
        })
      );
      if (this.editingMaster && this.doc.master) {
        this.doc.master.header = this.doc.master.header.filter((e) => !remove.has(e.id));
        this.doc.master.footer = this.doc.master.footer.filter((e) => !remove.has(e.id));
      } else {
        this.activePage.elements = this.activePage.elements.filter((e) => !remove.has(e.id));
      }
      this.selectedIds = [];
      this.commit();
    },
    groupSelected() {
      if (this.selectedIds.length < 2) return;
      const gid = uid();
      for (const el of this.selectedElements) {
        if (!el.locked) el.groupId = gid;
      }
      this.commit();
    },
    ungroupSelected() {
      for (const el of this.selectedElements) {
        el.groupId = void 0;
      }
      this.commit();
    },
    toggleLock() {
      if (!this.selected) return;
      const next = !this.selected.locked;
      for (const el of this.selectedElements) el.locked = next;
      this.commit();
    },
    bringForward() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i < 0 || i >= arr.length - 1) return;
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      this.commit();
    },
    sendBackward() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i <= 0) return;
      [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
      this.commit();
    },
    bringToFront() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i < 0 || i >= arr.length - 1) return;
      const [el] = arr.splice(i, 1);
      arr.push(el);
      this.commit();
    },
    sendToBack() {
      const i = this.selectedIndex;
      const arr = this.workingElements;
      if (i <= 0) return;
      const [el] = arr.splice(i, 1);
      arr.unshift(el);
      this.commit();
    },
    alignSelected(edge) {
      const els = this.selectedElements.filter((e) => !e.locked);
      if (!els.length) return;
      const { width, height } = this.pageSize;
      if (els.length === 1) {
        const el = els[0];
        if (edge === "left") el.x = 40;
        if (edge === "center") el.x = Math.round((width - el.width) / 2);
        if (edge === "right") el.x = Math.round(width - el.width - 40);
        if (edge === "top") el.y = 40;
        if (edge === "middle") el.y = Math.round((height - el.height) / 2);
        if (edge === "bottom") el.y = Math.round(height - el.height - 40);
      } else {
        const minX = Math.min(...els.map((e) => e.x));
        const maxX = Math.max(...els.map((e) => e.x + e.width));
        const minY = Math.min(...els.map((e) => e.y));
        const maxY = Math.max(...els.map((e) => e.y + e.height));
        for (const el of els) {
          if (edge === "left") el.x = minX;
          if (edge === "right") el.x = maxX - el.width;
          if (edge === "center") el.x = Math.round((minX + maxX - el.width) / 2);
          if (edge === "top") el.y = minY;
          if (edge === "bottom") el.y = maxY - el.height;
          if (edge === "middle") el.y = Math.round((minY + maxY - el.height) / 2);
        }
      }
      this.commit();
    },
    nudge(dx, dy, fine) {
      const step = fine ? 1 : this.snapEnabled ? 8 : 4;
      for (const el of this.selectedElements) {
        if (el.locked) continue;
        el.x += dx * step;
        el.y += dy * step;
      }
      this.commit();
    },
    addGuideFromRuler(axis, event) {
      const { x, y } = this.pageCoords(event);
      const guide = {
        id: uid(),
        axis,
        position: axis === "x" ? this.snap(x) : this.snap(y)
      };
      if (!this.doc.guides) this.doc.guides = [];
      this.doc.guides.push(guide);
      this.drag = { mode: "guide", axis, id: guide.id };
      this.commit(false);
    },
    removeGuide(id) {
      this.doc.guides = (this.doc.guides || []).filter((g) => g.id !== id);
      this.commit();
    },
    toggleEditMaster() {
      this.editingMaster = !this.editingMaster;
      this.selectedIds = [];
      if (this.editingMaster && !this.doc.master) {
        this.doc.master = { header: [], footer: [] };
      }
    },
    addMasterPageNumber() {
      if (!this.doc.master) this.doc.master = { header: [], footer: [] };
      const el = createText(this.pageSize.width / 2 - 40, this.pageSize.height - 48, {
        content: "Page {{page}} / {{pages}}",
        fontSize: 10,
        color: "#64748b",
        width: 80,
        height: 20,
        align: "center"
      });
      this.doc.master.footer.push(el);
      this.commit();
    },
    setWatermarkText(text) {
      this.doc.watermark = {
        type: "text",
        text,
        opacity: 0.12,
        rotation: -30,
        fontSize: 56,
        color: "#94a3b8"
      };
      this.commit();
    },
    clearWatermark() {
      this.doc.watermark = null;
      this.commit();
    },
    runFind() {
      const q = this.findQuery.trim().toLowerCase();
      this.findMatches = [];
      if (!q) return;
      this.doc.pages.forEach((page, pageIndex) => {
        for (const el of page.elements) {
          if (el.type === "text" || el.type === "sticky") {
            if (el.content.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "content" });
            }
          } else if (el.type === "badge" || el.type === "stamp") {
            if (el.label.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "label" });
            }
          } else if (el.type === "table") {
            if (el.cells.some((c) => c.toLowerCase().includes(q))) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "cells" });
            }
          } else if (el.type === "checkbox" || el.type === "formCheck") {
            if (el.label.toLowerCase().includes(q)) {
              this.findMatches.push({ pageIndex, elId: el.id, field: "label" });
            }
          }
        }
      });
      this.findIndex = this.findMatches.length ? 0 : -1;
      this.jumpToFindMatch();
    },
    jumpToFindMatch() {
      const m = this.findMatches[this.findIndex];
      if (!m) return;
      this.activePageIndex = m.pageIndex;
      this.selectedIds = [m.elId];
    },
    findNext() {
      if (!this.findMatches.length) return;
      this.findIndex = (this.findIndex + 1) % this.findMatches.length;
      this.jumpToFindMatch();
    },
    replaceCurrent() {
      const m = this.findMatches[this.findIndex];
      if (!m) return;
      const page = this.doc.pages[m.pageIndex];
      const el = page?.elements.find((e) => e.id === m.elId);
      if (!el) return;
      const q = this.findQuery;
      const r = this.replaceQuery;
      if (el.type === "text" || el.type === "sticky") {
        el.content = el.content.split(q).join(r);
      } else if (el.type === "badge" || el.type === "stamp" || el.type === "checkbox" || el.type === "formCheck") {
        el.label = el.label.split(q).join(r);
      } else if (el.type === "table") {
        el.cells = el.cells.map((c) => c.split(q).join(r));
      }
      this.commit();
      this.runFind();
    },
    replaceAll() {
      const q = this.findQuery;
      if (!q) return;
      const r = this.replaceQuery;
      for (const page of this.doc.pages) {
        for (const el of page.elements) {
          if (el.type === "text" || el.type === "sticky") el.content = el.content.split(q).join(r);
          else if (el.type === "badge" || el.type === "stamp" || el.type === "checkbox" || el.type === "formCheck") {
            el.label = el.label.split(q).join(r);
          } else if (el.type === "table") el.cells = el.cells.map((c) => c.split(q).join(r));
        }
      }
      this.commit();
      this.runFind();
    },
    addCommentAt(x, y) {
      const body = this.commentDraft.trim() || prompt("Comment") || "";
      if (!body.trim()) return;
      if (!this.doc.comments) this.doc.comments = [];
      this.doc.comments.push({
        id: uid(),
        pageId: this.activePage.id,
        x,
        y,
        body: body.trim(),
        author: this.authorName || "Reviewer",
        resolved: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      this.commentDraft = "";
      this.tool = "select";
      this.commit();
    },
    toggleCommentResolved(id) {
      const c = (this.doc.comments || []).find((c2) => c2.id === id);
      if (!c) return;
      c.resolved = !c.resolved;
      this.commit();
    },
    deleteComment(id) {
      this.doc.comments = (this.doc.comments || []).filter((c) => c.id !== id);
      this.commit();
    },
    saveBrand() {
      storeSet(BRAND_KEY, JSON.stringify(this.brand));
    },
    saveAuthorName() {
      storeSet(AUTHOR_KEY, this.authorName || "Reviewer");
    },
    applyBrandToSelection() {
      for (const el of this.selectedElements) {
        if (el.type === "text") {
          el.fontFamily = this.brand.defaultFont || el.fontFamily;
          if (this.brand.colors[2]) el.color = this.brand.colors[2];
        }
        if (el.type === "rect" && this.brand.colors[0]) el.fill = this.brand.colors[0];
      }
      this.commit();
      this.saveBrand();
    },
    async onBrandLogoSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("image", file);
      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Upload failed");
        this.brand.logoUrl = payload.url;
        this.brand.logoName = payload.name;
        this.saveBrand();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Logo upload failed");
      } finally {
        input.value = "";
      }
    },
    insertBrandLogo() {
      if (!this.brand.logoUrl) return;
      const el = createImage(40, 40, {
        src: this.brand.logoUrl,
        name: this.brand.logoName || "Logo",
        width: 120,
        height: 60
      });
      this.pushElement(el);
    },
    async onPdfImportSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("pdf", file);
      try {
        const res = await apiFetch("/api/import", { method: "POST", body: form });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Import failed");
        this.doc = normalizeDoc(payload.document);
        this.activePageIndex = 0;
        this.selectedIds = [];
        history.reset(this.doc);
        this.syncHistoryFlags();
        this.commit(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not import PDF");
      } finally {
        input.value = "";
      }
    },
    openExportModal() {
      this.showExportModal = true;
    },
    saveExportSettings() {
      storeSet(EXPORT_KEY, JSON.stringify(this.exportSettings));
    },
    onKeydown(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) {
        return;
      }
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        this.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === "y" || mod && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        this.redo();
        return;
      }
      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        this.duplicateSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "c") {
        event.preventDefault();
        this.copySelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "x") {
        event.preventDefault();
        this.cutSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        this.pasteClipboard();
        return;
      }
      if (mod && event.key.toLowerCase() === "g" && !event.shiftKey) {
        event.preventDefault();
        this.groupSelected();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "g") {
        event.preventDefault();
        this.ungroupSelected();
        return;
      }
      if (mod && event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.showFindReplace = true;
        return;
      }
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.commit(false);
        storeSet(STORAGE_KEY, JSON.stringify(this.doc));
        return;
      }
      if (mod && event.key.toLowerCase() === "e") {
        event.preventDefault();
        this.openExportModal();
        return;
      }
      if (event.key === "Escape") {
        this.selectedIds = [];
        this.editingTextId = null;
        this.tool = "select";
        this.pendingLibraryKind = null;
        this.placeHint = false;
        this.libraryKeepPlacing = false;
        this.showExportModal = false;
        this.showSignatureModal = false;
        this.showFindReplace = false;
        this.showFileMenu = false;
        this.showTemplates = false;
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        this.leftRail = "insert";
        this.showLibrary = true;
        queueMicrotask(() => {
          const input = this.$refs.librarySearch;
          input?.focus();
        });
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        this.deleteSelected();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.nudge(-1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.nudge(1, 0, event.shiftKey);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.nudge(0, -1, event.shiftKey);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.nudge(0, 1, event.shiftKey);
        return;
      }
      const map = {
        v: "select",
        t: "text",
        r: "rect",
        o: "ellipse",
        l: "line"
      };
      const tool = map[event.key.toLowerCase()];
      if (tool) this.tool = tool;
    },
    async onImageSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append("image", file);
      try {
        const res = await apiFetch("/api/upload", { method: "POST", body: form });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || "Upload failed");
        const imageEl = createImage(80, 80, {
          src: payload.url,
          name: payload.name,
          width: payload.width,
          height: payload.height
        });
        this.pushElement(imageEl);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not upload image.");
      } finally {
        input.value = "";
      }
    },
    openSignatureModal(x = null, y = null, replaceId = null) {
      this.signaturePlace = x != null && y != null ? { x, y } : null;
      this.signatureReplaceId = replaceId;
      this.signatureTab = "draw";
      this.signatureTyped = "";
      this.signatureHasInk = false;
      this.signatureBusy = false;
      this.showSignatureModal = true;
      this.tool = "select";
      this.pendingLibraryKind = null;
      this.placeHint = false;
      setTimeout(() => this.resetSignaturePad(), 40);
    },
    closeSignatureModal() {
      this.showSignatureModal = false;
      this.signaturePlace = null;
      this.signatureReplaceId = null;
      this.signatureHasInk = false;
    },
    signaturePad() {
      return this.$refs.signaturePad ?? null;
    },
    resetSignaturePad() {
      const canvas = this.signaturePad();
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 520;
      const cssH = canvas.clientHeight || 180;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      this.signatureHasInk = false;
    },
    clearSignaturePad() {
      this.resetSignaturePad();
      this.signatureTyped = "";
    },
    signaturePointerPos(event) {
      const canvas = this.signaturePad();
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    },
    onSignaturePointerDown(event) {
      if (this.signatureTab !== "draw") return;
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      canvas.setPointerCapture(event.pointerId);
      const { x, y } = this.signaturePointerPos(event);
      ctx.strokeStyle = this.signatureInk;
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      this.signatureHasInk = true;
      this._sigDrawing = true;
    },
    onSignaturePointerMove(event) {
      if (!this._sigDrawing) return;
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      const { x, y } = this.signaturePointerPos(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    onSignaturePointerUp(event) {
      const canvas = this.signaturePad();
      canvas?.releasePointerCapture(event.pointerId);
      this._sigDrawing = false;
    },
    renderTypedSignature() {
      const text = this.signatureTyped.trim();
      if (!text) {
        this.resetSignaturePad();
        return;
      }
      const canvas = this.signaturePad();
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const cssW = canvas.clientWidth || 520;
      const cssH = canvas.clientHeight || 180;
      this.resetSignaturePad();
      const again = this.signaturePad()?.getContext("2d");
      if (!again) return;
      again.fillStyle = this.signatureInk;
      again.textAlign = "center";
      again.textBaseline = "middle";
      let size = 64;
      again.font = `${size}px "Caveat", "Segoe Script", "Comic Sans MS", cursive`;
      while (size > 28 && again.measureText(text).width > cssW - 40) {
        size -= 2;
        again.font = `${size}px "Caveat", "Segoe Script", "Comic Sans MS", cursive`;
      }
      again.fillText(text, cssW / 2, cssH / 2);
      this.signatureHasInk = true;
    },
    async uploadSignatureBlob(blob, name) {
      const form = new FormData();
      form.append("image", blob, name);
      const res = await apiFetch("/api/upload", { method: "POST", body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Signature upload failed");
      return payload;
    },
    async placeSignatureFromPayload(payload) {
      const maxW = 280;
      const scale = Math.min(1, maxW / Math.max(payload.width, 1));
      const width = Math.max(120, Math.round(payload.width * scale));
      const height = Math.max(48, Math.round(payload.height * scale));
      const page = this.pageSize;
      const x = this.snap(this.signaturePlace?.x ?? page.width / 2 - width / 2);
      const y = this.snap(this.signaturePlace?.y ?? page.height - height - 72);
      if (this.signatureReplaceId) {
        const existing = this.workingElements.find((e) => e.id === this.signatureReplaceId);
        if (existing && existing.type === "signature") {
          existing.src = payload.url;
          existing.name = payload.name || "Signature";
          existing.width = width;
          existing.height = height;
          this.commit();
          this.closeSignatureModal();
          return;
        }
      }
      const el = createSignature(x, y, {
        src: payload.url,
        name: payload.name || "Signature",
        width,
        height
      });
      this.pushElement(el);
      this.closeSignatureModal();
    },
    async confirmSignature() {
      if (this.signatureBusy) return;
      try {
        this.signatureBusy = true;
        if (this.signatureTab === "type") {
          this.renderTypedSignature();
        }
        if (this.signatureTab === "upload") {
          this.$refs.signatureFileInput.click();
          return;
        }
        const canvas = this.signaturePad();
        if (!canvas || !this.signatureHasInk) {
          alert("Draw or type a signature first.");
          return;
        }
        const trimmed = trimSignatureCanvas(canvas);
        const blob = await new Promise(
          (resolve) => trimmed.toBlob(resolve, "image/png")
        );
        if (!blob) throw new Error("Could not capture signature");
        const payload = await this.uploadSignatureBlob(blob, "signature.png");
        await this.placeSignatureFromPayload({
          ...payload,
          name: this.signatureTyped.trim() || "Signature"
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not add signature");
      } finally {
        this.signatureBusy = false;
      }
    },
    async onSignatureFileSelected(event) {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      try {
        this.signatureBusy = true;
        const payload = await this.uploadSignatureBlob(file, file.name);
        await this.placeSignatureFromPayload(payload);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not upload signature");
      } finally {
        this.signatureBusy = false;
        input.value = "";
      }
    },
    async exportPdf() {
      this.saveExportSettings();
      this.exporting = true;
      this.showExportModal = false;
      try {
        const res = await apiFetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: this.doc.name,
            pageSize: this.doc.pageSize,
            pageBackground: this.doc.pageBackground,
            pages: this.doc.pages,
            master: this.doc.master,
            watermark: this.doc.watermark,
            importedPdf: this.doc.importedPdf,
            exportSettings: this.exportSettings
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Export failed");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.doc.name.replace(/[^\w.-]+/g, "_") || "document"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Could not export PDF.");
      } finally {
        this.exporting = false;
      }
    }
  };
}
document.addEventListener("alpine:init", () => {
  const Alpine = window.Alpine;
  Alpine.data("pdfEditor", pdfEditor);
  Alpine.data("themeToggle", () => ({
    theme: document.documentElement.getAttribute("data-theme") || "dark",
    init() {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        this.theme = saved;
        document.documentElement.setAttribute("data-theme", saved);
      }
    },
    toggleTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", this.theme);
      localStorage.setItem(THEME_KEY, this.theme);
    }
  }));
});
