import type { ElementType, IconKind } from "../shared/types.js";
import {
  createArrow,
  createBadge,
  createCheckbox,
  createDivider,
  createEllipse,
  createIcon,
  createLine,
  createRect,
  createStamp,
  createSticky,
  createTable,
  createText,
} from "./factories.js";
import type { PdfElement } from "../shared/types.js";

export type LibraryCategory =
  | "all"
  | "favorites"
  | "recent"
  | "basics"
  | "shapes"
  | "notes"
  | "presets"
  | "layout"
  | "forms"
  | "brand"
  | "data"
  | "icons"
  | "stamps";

export interface LibraryItem {
  id: string;
  category: Exclude<LibraryCategory, "all" | "favorites" | "recent">;
  label: string;
  hint: string;
  tags: string[];
  kind:
    | ElementType
    | `icon:${IconKind}`
    | `stamp:${string}`
    | `badge:${string}`
    | `preset:${string}`;
  preview: string;
}

export const LIBRARY_CATEGORIES: { id: LibraryCategory; label: string }[] = [
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
  { id: "stamps", label: "Stamps" },
];

export const LIBRARY_ITEMS: LibraryItem[] = [
  // Basics
  {
    id: "text",
    category: "basics",
    label: "Text",
    hint: "Editable paragraph",
    tags: ["text", "paragraph", "copy"],
    kind: "text",
    preview: "T",
  },
  {
    id: "image",
    category: "basics",
    label: "Image",
    hint: "Upload PNG/JPEG",
    tags: ["photo", "picture", "media"],
    kind: "image",
    preview: "🖼",
  },
  {
    id: "sign",
    category: "basics",
    label: "Signature",
    hint: "Draw, type, or upload",
    tags: ["sign", "signature", "ink"],
    kind: "signature",
    preview: "✍",
  },
  {
    id: "divider",
    category: "basics",
    label: "Divider",
    hint: "Horizontal rule",
    tags: ["line", "hr", "separator"],
    kind: "divider",
    preview: "—",
  },
  {
    id: "divider-dash",
    category: "basics",
    label: "Dashed line",
    hint: "Dashed divider",
    tags: ["line", "dashed"],
    kind: "preset:divider-dash",
    preview: "- -",
  },
  {
    id: "divider-thick",
    category: "basics",
    label: "Thick rule",
    hint: "Bold separator",
    tags: ["line", "bold"],
    kind: "preset:divider-thick",
    preview: "━━",
  },
  {
    id: "spacer",
    category: "basics",
    label: "Spacer box",
    hint: "Invisible layout gap",
    tags: ["space", "gap"],
    kind: "preset:spacer",
    preview: "↕",
  },

  // Shapes
  {
    id: "rect",
    category: "shapes",
    label: "Rectangle",
    hint: "Filled box",
    tags: ["box", "shape"],
    kind: "rect",
    preview: "▭",
  },
  {
    id: "ellipse",
    category: "shapes",
    label: "Ellipse",
    hint: "Circle / oval",
    tags: ["oval", "shape"],
    kind: "ellipse",
    preview: "○",
  },
  {
    id: "line",
    category: "shapes",
    label: "Line",
    hint: "Straight stroke",
    tags: ["stroke"],
    kind: "line",
    preview: "/",
  },
  {
    id: "arrow",
    category: "shapes",
    label: "Arrow",
    hint: "Directional arrow",
    tags: ["pointer", "direction"],
    kind: "arrow",
    preview: "→",
  },
  {
    id: "arrow-down",
    category: "shapes",
    label: "Arrow down",
    hint: "Vertical arrow",
    tags: ["pointer"],
    kind: "preset:arrow-down",
    preview: "↓",
  },
  {
    id: "rounded",
    category: "shapes",
    label: "Rounded box",
    hint: "Soft corners",
    tags: ["card"],
    kind: "preset:rounded",
    preview: "▢",
  },
  {
    id: "frame",
    category: "shapes",
    label: "Frame",
    hint: "Stroke only",
    tags: ["border"],
    kind: "preset:frame",
    preview: "□",
  },
  {
    id: "circle",
    category: "shapes",
    label: "Circle",
    hint: "Perfect circle",
    tags: ["dot"],
    kind: "preset:circle",
    preview: "●",
  },
  {
    id: "triangle",
    category: "shapes",
    label: "Accent wedge",
    hint: "Diagonal block",
    tags: ["shape"],
    kind: "preset:wedge",
    preview: "◢",
  },
  {
    id: "shadow-card",
    category: "shapes",
    label: "Card block",
    hint: "Soft card surface",
    tags: ["card", "ui"],
    kind: "preset:card",
    preview: "▭",
  },

  // Notes
  {
    id: "sticky",
    category: "notes",
    label: "Sticky note",
    hint: "Yellow memo",
    tags: ["note", "memo"],
    kind: "sticky",
    preview: "🗒",
  },
  {
    id: "sticky-pink",
    category: "notes",
    label: "Pink sticky",
    hint: "Soft pink note",
    tags: ["note"],
    kind: "preset:sticky-pink",
    preview: "📝",
  },
  {
    id: "sticky-mint",
    category: "notes",
    label: "Mint sticky",
    hint: "Mint memo",
    tags: ["note"],
    kind: "preset:sticky-mint",
    preview: "📗",
  },
  {
    id: "sticky-blue",
    category: "notes",
    label: "Blue sticky",
    hint: "Cool blue note",
    tags: ["note"],
    kind: "preset:sticky-blue",
    preview: "📘",
  },
  {
    id: "badge",
    category: "notes",
    label: "Badge",
    hint: "Pill label",
    tags: ["chip", "tag"],
    kind: "badge",
    preview: "●",
  },
  {
    id: "checkbox",
    category: "notes",
    label: "Checkbox",
    hint: "Checklist row",
    tags: ["todo", "check"],
    kind: "checkbox",
    preview: "☑",
  },
  {
    id: "checkbox-done",
    category: "notes",
    label: "Checked item",
    hint: "Already done",
    tags: ["todo"],
    kind: "preset:checkbox-done",
    preview: "✓",
  },
  {
    id: "badge-sale",
    category: "notes",
    label: "Sale badge",
    hint: "Promo chip",
    tags: ["promo"],
    kind: "badge:SALE",
    preview: "%",
  },
  {
    id: "badge-new",
    category: "notes",
    label: "New badge",
    hint: "Highlight chip",
    tags: ["promo"],
    kind: "badge:NEW",
    preview: "N",
  },
  {
    id: "badge-vip",
    category: "notes",
    label: "VIP badge",
    hint: "Gold chip",
    tags: ["promo"],
    kind: "preset:badge-vip",
    preview: "★",
  },
  {
    id: "badge-hot",
    category: "notes",
    label: "Hot badge",
    hint: "Attention chip",
    tags: ["promo"],
    kind: "preset:badge-hot",
    preview: "🔥",
  },

  // Presets — typography / content blocks
  {
    id: "heading",
    category: "presets",
    label: "Heading",
    hint: "Bold title",
    tags: ["title", "h1"],
    kind: "preset:heading",
    preview: "H",
  },
  {
    id: "subhead",
    category: "presets",
    label: "Subheading",
    hint: "Section title",
    tags: ["h2"],
    kind: "preset:subhead",
    preview: "h",
  },
  {
    id: "quote",
    category: "presets",
    label: "Quote",
    hint: "Pull quote block",
    tags: ["blockquote"],
    kind: "preset:quote",
    preview: "“",
  },
  {
    id: "callout",
    category: "presets",
    label: "Callout",
    hint: "Accent tip box",
    tags: ["tip", "info"],
    kind: "preset:callout",
    preview: "!",
  },
  {
    id: "warning-box",
    category: "presets",
    label: "Warning box",
    hint: "Alert callout",
    tags: ["alert"],
    kind: "preset:warning-box",
    preview: "⚠",
  },
  {
    id: "caption",
    category: "presets",
    label: "Caption",
    hint: "Small muted text",
    tags: ["footnote"],
    kind: "preset:caption",
    preview: "c",
  },
  {
    id: "highlight",
    category: "presets",
    label: "Highlight bar",
    hint: "Accent strip",
    tags: ["marker"],
    kind: "preset:highlight",
    preview: "▬",
  },
  {
    id: "footer",
    category: "presets",
    label: "Page footer",
    hint: "Footer line + text",
    tags: ["footer"],
    kind: "preset:footer",
    preview: "⌐",
  },
  {
    id: "date",
    category: "presets",
    label: "Date stamp",
    hint: "Today’s date",
    tags: ["date"],
    kind: "preset:date",
    preview: "📅",
  },
  {
    id: "bullets",
    category: "presets",
    label: "Bullet list",
    hint: "3 bullet points",
    tags: ["list", "ul"],
    kind: "preset:bullets",
    preview: "•",
  },
  {
    id: "numbers",
    category: "presets",
    label: "Numbered list",
    hint: "1–3 steps",
    tags: ["list", "ol"],
    kind: "preset:numbers",
    preview: "1.",
  },
  {
    id: "cta",
    category: "presets",
    label: "CTA button",
    hint: "Call to action",
    tags: ["button", "cta"],
    kind: "preset:cta",
    preview: "→",
  },
  {
    id: "signature-line",
    category: "presets",
    label: "Signature line",
    hint: "Blank sign-here line",
    tags: ["sign", "line"],
    kind: "preset:signature",
    preview: "___",
  },
  {
    id: "address",
    category: "presets",
    label: "Address block",
    hint: "Contact address",
    tags: ["address", "contact"],
    kind: "preset:address",
    preview: "⌂",
  },

  // Layout
  {
    id: "header-bar",
    category: "layout",
    label: "Header bar",
    hint: "Full-width top band",
    tags: ["header", "banner"],
    kind: "preset:header-bar",
    preview: "▬",
  },
  {
    id: "sidebar-band",
    category: "layout",
    label: "Side band",
    hint: "Left accent strip",
    tags: ["sidebar"],
    kind: "preset:sidebar-band",
    preview: "|",
  },
  {
    id: "two-col",
    category: "layout",
    label: "Two columns",
    hint: "Paired text blocks",
    tags: ["columns", "grid"],
    kind: "preset:two-col",
    preview: "▥",
  },
  {
    id: "hero-title",
    category: "layout",
    label: "Hero title",
    hint: "Large cover title",
    tags: ["cover", "hero"],
    kind: "preset:hero-title",
    preview: "A",
  },
  {
    id: "page-number",
    category: "layout",
    label: "Page number",
    hint: "Centered folio",
    tags: ["page", "folio"],
    kind: "preset:page-number",
    preview: "#",
  },
  {
    id: "section-rule",
    category: "layout",
    label: "Section break",
    hint: "Title + rule",
    tags: ["section"],
    kind: "preset:section-rule",
    preview: "§",
  },

  // Forms
  {
    id: "form-name",
    category: "forms",
    label: "Name field",
    hint: "Label + underline",
    tags: ["form", "input"],
    kind: "preset:form-name",
    preview: "_",
  },
  {
    id: "form-email",
    category: "forms",
    label: "Email field",
    hint: "Email underline",
    tags: ["form"],
    kind: "preset:form-email",
    preview: "@",
  },
  {
    id: "form-date",
    category: "forms",
    label: "Date field",
    hint: "Date underline",
    tags: ["form"],
    kind: "preset:form-date",
    preview: "/",
  },
  {
    id: "form-check-row",
    category: "forms",
    label: "Agree row",
    hint: "Consent checkbox",
    tags: ["form", "gdpr"],
    kind: "preset:form-check",
    preview: "☐",
  },
  {
    id: "rating",
    category: "forms",
    label: "Star rating",
    hint: "5-star score",
    tags: ["rating", "stars"],
    kind: "preset:rating",
    preview: "★★",
  },
  {
    id: "progress",
    category: "forms",
    label: "Progress bar",
    hint: "70% filled bar",
    tags: ["progress", "meter"],
    kind: "preset:progress",
    preview: "▰",
  },
  {
    id: "qr-box",
    category: "forms",
    label: "QR placeholder",
    hint: "Square QR frame",
    tags: ["qr", "code"],
    kind: "preset:qr",
    preview: "▣",
  },

  // Brand
  {
    id: "logo-mark",
    category: "brand",
    label: "Logo mark",
    hint: "Round brand mark",
    tags: ["logo", "brand"],
    kind: "preset:logo-mark",
    preview: "PS",
  },
  {
    id: "brand-name",
    category: "brand",
    label: "Brand name",
    hint: "Company title",
    tags: ["logo", "name"],
    kind: "preset:brand-name",
    preview: "Aa",
  },
  {
    id: "tagline",
    category: "brand",
    label: "Tagline",
    hint: "Short slogan",
    tags: ["slogan"],
    kind: "preset:tagline",
    preview: "…",
  },
  {
    id: "watermark",
    category: "brand",
    label: "Watermark",
    hint: "Faded diagonal text",
    tags: ["watermark"],
    kind: "preset:watermark",
    preview: "WM",
  },
  {
    id: "color-swatch",
    category: "brand",
    label: "Color swatches",
    hint: "3 brand colors",
    tags: ["palette"],
    kind: "preset:swatches",
    preview: "◐",
  },

  // Data
  {
    id: "table",
    category: "data",
    label: "Table 3×3",
    hint: "Simple grid",
    tags: ["table"],
    kind: "table",
    preview: "▦",
  },
  {
    id: "table-wide",
    category: "data",
    label: "Table 4×5",
    hint: "Wider grid",
    tags: ["table"],
    kind: "preset:table-wide",
    preview: "▦",
  },
  {
    id: "table-invoice",
    category: "data",
    label: "Invoice lines",
    hint: "Desc / Qty / Price",
    tags: ["invoice", "table"],
    kind: "preset:table-invoice",
    preview: "▤",
  },
  {
    id: "price-row",
    category: "data",
    label: "Price row",
    hint: "Label + amount",
    tags: ["price"],
    kind: "preset:price-row",
    preview: "€",
  },
  {
    id: "totals",
    category: "data",
    label: "Totals block",
    hint: "Subtotal / tax / total",
    tags: ["invoice", "sum"],
    kind: "preset:totals",
    preview: "Σ",
  },
  {
    id: "kpi",
    category: "data",
    label: "KPI card",
    hint: "Big number + label",
    tags: ["metric", "stat"],
    kind: "preset:kpi",
    preview: "42",
  },
  {
    id: "timeline",
    category: "data",
    label: "Timeline step",
    hint: "Step marker + text",
    tags: ["timeline"],
    kind: "preset:timeline",
    preview: "①",
  },

  // Icons
  {
    id: "icon-star",
    category: "icons",
    label: "Star",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:star",
    preview: "★",
  },
  {
    id: "icon-heart",
    category: "icons",
    label: "Heart",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:heart",
    preview: "♥",
  },
  {
    id: "icon-check",
    category: "icons",
    label: "Check",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:check",
    preview: "✓",
  },
  {
    id: "icon-x",
    category: "icons",
    label: "Close",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:x",
    preview: "✕",
  },
  {
    id: "icon-warn",
    category: "icons",
    label: "Warning",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:warning",
    preview: "!",
  },
  {
    id: "icon-info",
    category: "icons",
    label: "Info",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:info",
    preview: "i",
  },
  {
    id: "icon-mail",
    category: "icons",
    label: "Mail",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:mail",
    preview: "@",
  },
  {
    id: "icon-phone",
    category: "icons",
    label: "Phone",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:phone",
    preview: "☎",
  },
  {
    id: "icon-pin",
    category: "icons",
    label: "Pin",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:pin",
    preview: "📍",
  },
  {
    id: "icon-user",
    category: "icons",
    label: "User",
    hint: "Icon",
    tags: ["icon"],
    kind: "icon:user",
    preview: "☺",
  },

  // Stamps
  {
    id: "stamp-ok",
    category: "stamps",
    label: "Approved",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:APPROVED",
    preview: "OK",
  },
  {
    id: "stamp-draft",
    category: "stamps",
    label: "Draft",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:DRAFT",
    preview: "DR",
  },
  {
    id: "stamp-paid",
    category: "stamps",
    label: "Paid",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:PAID",
    preview: "$",
  },
  {
    id: "stamp-conf",
    category: "stamps",
    label: "Confidential",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:CONFIDENTIAL",
    preview: "🔒",
  },
  {
    id: "stamp-urgent",
    category: "stamps",
    label: "Urgent",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:URGENT",
    preview: "!!",
  },
  {
    id: "stamp-copy",
    category: "stamps",
    label: "Copy",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:COPY",
    preview: "©",
  },
  {
    id: "stamp-void",
    category: "stamps",
    label: "Void",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:VOID",
    preview: "⌀",
  },
  {
    id: "stamp-sample",
    category: "stamps",
    label: "Sample",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:SAMPLE",
    preview: "SM",
  },
  {
    id: "stamp-final",
    category: "stamps",
    label: "Final",
    hint: "Round stamp",
    tags: ["stamp"],
    kind: "stamp:FINAL",
    preview: "FN",
  },
];

function createPreset(id: string, x: number, y: number): PdfElement {
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
        cornerRadius: 4,
      });
    case "rounded":
      return createRect(x, y, { cornerRadius: 16, fill: "#14b8a6", strokeWidth: 0 });
    case "frame":
      return createRect(x, y, {
        fill: "#ffffff",
        stroke: "#0f766e",
        strokeWidth: 2,
        cornerRadius: 4,
      });
    case "circle":
      return createEllipse(x, y, { width: 120, height: 120, fill: "#0d9488" });
    case "wedge":
      return createRect(x, y, {
        width: 80,
        height: 180,
        fill: "#0f766e",
        strokeWidth: 0,
        rotation: -8,
      });
    case "card":
      return createRect(x, y, {
        width: 280,
        height: 160,
        fill: "#ffffff",
        stroke: "#cbd5e1",
        strokeWidth: 1,
        cornerRadius: 12,
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
        height: 44,
      });
    case "subhead":
      return createText(x, y, {
        content: "Subheading",
        fontSize: 20,
        fontWeight: "bold",
        width: 320,
        height: 32,
      });
    case "quote":
      return createText(x, y, {
        content: "“A short pull quote that stands out on the page.”",
        fontSize: 16,
        fontFamily: "Times-Roman",
        width: 360,
        height: 70,
        color: "#334155",
      });
    case "callout":
      return createRect(x, y, {
        width: 360,
        height: 72,
        fill: "#ecfdf5",
        stroke: "#0d9488",
        strokeWidth: 1.5,
        cornerRadius: 8,
      });
    case "warning-box":
      return createRect(x, y, {
        width: 360,
        height: 72,
        fill: "#fff7ed",
        stroke: "#ea580c",
        strokeWidth: 1.5,
        cornerRadius: 8,
      });
    case "caption":
      return createText(x, y, {
        content: "Figure caption or footnote",
        fontSize: 10,
        color: "#64748b",
        width: 280,
        height: 20,
      });
    case "highlight":
      return createRect(x, y, {
        width: 420,
        height: 28,
        fill: "#fef08a",
        strokeWidth: 0,
        cornerRadius: 4,
      });
    case "footer":
      return createText(x, y, {
        content: "Page footer · PDF Studio",
        fontSize: 10,
        color: "#94a3b8",
        width: 400,
        height: 18,
        align: "center",
      });
    case "date":
      return createText(x, y, {
        content: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        fontSize: 12,
        color: "#475569",
        width: 220,
        height: 22,
      });
    case "bullets":
      return createText(x, y, {
        content: "• First highlight\n• Second highlight\n• Third highlight",
        fontSize: 13,
        width: 280,
        height: 80,
      });
    case "numbers":
      return createText(x, y, {
        content: "1. Discover\n2. Design\n3. Deliver",
        fontSize: 13,
        width: 240,
        height: 80,
      });
    case "cta":
      return createBadge(x, y, {
        label: "Get started →",
        width: 160,
        height: 40,
        fontSize: 13,
        fill: "#0f766e",
      });
    case "signature":
      return createText(x, y, {
        content: "Signature: _______________________",
        fontSize: 12,
        width: 320,
        height: 24,
      });
    case "address":
      return createText(x, y, {
        content: "Company Name\n123 Design Avenue\nBerlin, Germany",
        fontSize: 11,
        color: "#475569",
        width: 200,
        height: 60,
      });
    case "header-bar":
      return createRect(x, y, {
        width: 595,
        height: 72,
        fill: "#0f766e",
        strokeWidth: 0,
        cornerRadius: 0,
      });
    case "sidebar-band":
      return createRect(x, y, {
        width: 36,
        height: 842,
        fill: "#134e4a",
        strokeWidth: 0,
      });
    case "two-col":
      return createText(x, y, {
        content: "Column A\nDetails go here.\n\nColumn B\nMore details.",
        fontSize: 12,
        width: 420,
        height: 110,
      });
    case "hero-title":
      return createText(x, y, {
        content: "Your big idea",
        fontSize: 48,
        fontWeight: "bold",
        width: 480,
        height: 64,
      });
    case "page-number":
      return createText(x, y, {
        content: "— 1 —",
        fontSize: 11,
        color: "#94a3b8",
        width: 80,
        height: 20,
        align: "center",
      });
    case "section-rule":
      return createText(x, y, {
        content: "SECTION 01  —————————————————",
        fontSize: 11,
        fontWeight: "bold",
        width: 480,
        height: 22,
        color: "#0f766e",
      });
    case "form-name":
      return createText(x, y, {
        content: "Full name\n________________________________",
        fontSize: 12,
        width: 320,
        height: 44,
      });
    case "form-email":
      return createText(x, y, {
        content: "Email\n________________________________",
        fontSize: 12,
        width: 320,
        height: 44,
      });
    case "form-date":
      return createText(x, y, {
        content: "Date\n____ / ____ / ________",
        fontSize: 12,
        width: 240,
        height: 44,
      });
    case "form-check":
      return createCheckbox(x, y, {
        label: "I agree to the terms and conditions",
        width: 340,
      });
    case "rating":
      return createText(x, y, {
        content: "★★★★☆  4.0",
        fontSize: 18,
        color: "#ca8a04",
        width: 160,
        height: 28,
      });
    case "progress":
      return createRect(x, y, {
        width: 280,
        height: 16,
        fill: "#ccfbf1",
        stroke: "#0d9488",
        strokeWidth: 1,
        cornerRadius: 8,
      });
    case "qr":
      return createRect(x, y, {
        width: 96,
        height: 96,
        fill: "#ffffff",
        stroke: "#1a1a1a",
        strokeWidth: 2,
        cornerRadius: 4,
      });
    case "logo-mark":
      return createEllipse(x, y, {
        width: 64,
        height: 64,
        fill: "#0d9488",
        strokeWidth: 0,
      });
    case "brand-name":
      return createText(x, y, {
        content: "PDF Studio",
        fontSize: 22,
        fontWeight: "bold",
        width: 200,
        height: 32,
      });
    case "tagline":
      return createText(x, y, {
        content: "Design documents that feel finished.",
        fontSize: 12,
        color: "#64748b",
        width: 280,
        height: 24,
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
        height: 70,
      });
    case "swatches":
      return createRect(x, y, {
        width: 180,
        height: 40,
        fill: "#0d9488",
        strokeWidth: 0,
        cornerRadius: 6,
      });
    case "table-wide":
      return createTable(x, y, {
        rows: 5,
        cols: 4,
        width: 480,
        height: 180,
        cells: Array.from({ length: 20 }, (_, i) =>
          i < 4 ? `Col ${i + 1}` : `R${Math.floor(i / 4)}C${(i % 4) + 1}`,
        ),
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
          "€1,200",
          "Hosting",
          "1",
          "€240",
          "Support pack",
          "1",
          "€180",
        ],
      });
    case "price-row":
      return createText(x, y, {
        content: "Design package ........................ €890",
        fontSize: 13,
        width: 420,
        height: 24,
      });
    case "totals":
      return createText(x, y, {
        content: "Subtotal          €1,620\nTax (19%)           €308\nTotal             €1,928",
        fontSize: 13,
        fontWeight: "bold",
        width: 220,
        height: 70,
        align: "right",
      });
    case "kpi":
      return createText(x, y, {
        content: "98%\nCustomer satisfaction",
        fontSize: 28,
        fontWeight: "bold",
        width: 200,
        height: 70,
        color: "#0f766e",
      });
    case "timeline":
      return createText(x, y, {
        content: "①  Discovery call\n    Align goals and timeline",
        fontSize: 13,
        width: 260,
        height: 50,
      });
    default:
      return createText(x, y);
  }
}

export function createFromLibrary(
  kind: LibraryItem["kind"],
  x: number,
  y: number,
): PdfElement | "image" | "signature" {
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
    return createIcon(x, y, kind.slice(5) as IconKind);
  }
  if (kind.startsWith("badge:")) {
    const label = kind.slice(6);
    return createBadge(x, y, {
      label,
      fill: label === "NEW" ? "#2563eb" : "#e11d48",
    });
  }
  if (kind.startsWith("stamp:")) {
    const label = kind.slice(6);
    const colors: Record<string, string> = {
      APPROVED: "#16a34a",
      PAID: "#2563eb",
      URGENT: "#ea580c",
      COPY: "#475569",
      VOID: "#64748b",
      DRAFT: "#dc2626",
      CONFIDENTIAL: "#dc2626",
      SAMPLE: "#7c3aed",
      FINAL: "#0f766e",
    };
    return createStamp(x, y, {
      label,
      color: colors[label] ?? "#dc2626",
      fontSize: label.length > 8 ? 11 : 16,
    });
  }
  if (kind.startsWith("preset:")) {
    return createPreset(kind.slice(7), x, y);
  }

  return createText(x, y);
}

export function matchesLibraryQuery(item: LibraryItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.label.toLowerCase().includes(q) ||
    item.hint.toLowerCase().includes(q) ||
    item.category.includes(q) ||
    item.tags.some((t) => t.includes(q))
  );
}
