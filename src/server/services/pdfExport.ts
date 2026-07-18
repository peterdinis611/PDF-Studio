import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PAGE_SIZES,
  type ArrowElement,
  type BadgeElement,
  type CheckboxElement,
  type DividerElement,
  type ExportPayload,
  type EllipseElement,
  type FormCheckElement,
  type FormSelectElement,
  type FormTextElement,
  type IconElement,
  type ImageElement,
  type SignatureElement,
  type LineElement,
  type PdfElement,
  type RectElement,
  type StampElement,
  type StickyElement,
  type TableElement,
  type TextElement,
  type DocWatermark,
} from "../../shared/types.js";
import { resolveUploadPath } from "./pdfImport.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const fontsRoot = path.resolve(root, "uploads/fonts"); // legacy shared fonts fallback

type Fonts = {
  helvetica: PDFFont;
  helveticaBold: PDFFont;
  helveticaOblique: PDFFont;
  helveticaBoldOblique: PDFFont;
  times: PDFFont;
  timesBold: PDFFont;
  timesItalic: PDFFont;
  timesBoldItalic: PDFFont;
  courier: PDFFont;
  courierBold: PDFFont;
  courierOblique: PDFFont;
  courierBoldOblique: PDFFont;
  custom: Map<string, PDFFont>;
};

function hexToRgb(hex: string) {
  const cleaned = (hex || "#000000").replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return rgb(0, 0, 0);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function toPdfY(pageHeight: number, y: number, height: number) {
  return pageHeight - y - height;
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + radius} ${y}`,
    `H ${x + w - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + w} ${y + radius}`,
    `V ${y + h - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + w - radius} ${y + h}`,
    `H ${x + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x} ${y + h - radius}`,
    `V ${y + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x + radius} ${y}`,
    "Z",
  ].join(" ");
}

async function loadFonts(doc: PDFDocument, customFonts: ExportPayload["customFonts"] = []): Promise<Fonts> {
  const fonts: Fonts = {
    helvetica: await doc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await doc.embedFont(StandardFonts.HelveticaBold),
    helveticaOblique: await doc.embedFont(StandardFonts.HelveticaOblique),
    helveticaBoldOblique: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
    times: await doc.embedFont(StandardFonts.TimesRoman),
    timesBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    timesBoldItalic: await doc.embedFont(StandardFonts.TimesRomanBoldItalic),
    courier: await doc.embedFont(StandardFonts.Courier),
    courierBold: await doc.embedFont(StandardFonts.CourierBold),
    courierOblique: await doc.embedFont(StandardFonts.CourierOblique),
    courierBoldOblique: await doc.embedFont(StandardFonts.CourierBoldOblique),
    custom: new Map(),
  };

  for (const cf of customFonts || []) {
    const filePath = resolveUploadPath(cf.url) || path.resolve(fontsRoot, path.basename(cf.url));
    try {
      const bytes = await fs.readFile(filePath);
      const embedded = await doc.embedFont(bytes);
      fonts.custom.set(cf.id, embedded);
      fonts.custom.set(`custom:${cf.id}`, embedded);
    } catch {
      /* skip missing custom font */
    }
  }

  return fonts;
}

function pickFont(
  fonts: Fonts,
  family: string,
  bold: boolean,
  italic: boolean,
): PDFFont {
  if (family.startsWith("custom:")) {
    const custom = fonts.custom.get(family) || fonts.custom.get(family.slice(7));
    if (custom) return custom;
  }
  const customDirect = fonts.custom.get(family);
  if (customDirect) return customDirect;

  const serif = family === "Times-Roman" || family === "Lora" || family === "Playfair";
  const mono = family === "Courier";

  if (serif) {
    if (bold && italic) return fonts.timesBoldItalic;
    if (bold) return fonts.timesBold;
    if (italic) return fonts.timesItalic;
    return fonts.times;
  }
  if (mono) {
    if (bold && italic) return fonts.courierBoldOblique;
    if (bold) return fonts.courierBold;
    if (italic) return fonts.courierOblique;
    return fonts.courier;
  }
  if (bold && italic) return fonts.helveticaBoldOblique;
  if (bold) return fonts.helveticaBold;
  if (italic) return fonts.helveticaOblique;
  return fonts.helvetica;
}

function substituteTokens(text: string, pageIndex: number, pageCount: number) {
  return text
    .replace(/\{\{page\}\}/g, String(pageIndex + 1))
    .replace(/\{\{pages\}\}/g, String(pageCount));
}

function formatTextLines(el: TextElement, pageIndex: number, pageCount: number): string[] {
  let content = substituteTokens(el.content || "", pageIndex, pageCount);
  const raw = content.split("\n");
  if (el.listStyle === "bullet") {
    return raw.map((line) => (line.trim() ? `• ${line}` : line));
  }
  if (el.listStyle === "number") {
    let n = 1;
    return raw.map((line) => (line.trim() ? `${n++}. ${line}` : line));
  }
  return raw;
}

async function drawText(
  page: PDFPage,
  el: TextElement,
  pageHeight: number,
  fonts: Fonts,
  pageIndex: number,
  pageCount: number,
) {
  const font = pickFont(fonts, el.fontFamily, el.fontWeight === "bold", el.fontStyle === "italic");
  const lines = formatTextLines(el, pageIndex, pageCount);
  const lineHeight = el.fontSize * (el.lineHeight || 1.25);
  let cursorY = toPdfY(pageHeight, el.y, el.fontSize);

  for (const line of lines) {
    const textWidth = font.widthOfTextAtSize(line, el.fontSize) + (el.letterSpacing || 0) * Math.max(0, line.length - 1);
    let x = el.x;
    if (el.align === "center") x = el.x + (el.width - textWidth) / 2;
    if (el.align === "right") x = el.x + el.width - textWidth;

    if (el.letterSpacing) {
      let cx = Math.max(0, x);
      for (const ch of line) {
        page.drawText(ch, {
          x: cx,
          y: cursorY,
          size: el.fontSize,
          font,
          color: hexToRgb(el.color),
          opacity: el.opacity,
          rotate: degrees(el.rotation || 0),
        });
        cx += font.widthOfTextAtSize(ch, el.fontSize) + el.letterSpacing;
      }
    } else {
      page.drawText(line, {
        x: Math.max(0, x),
        y: cursorY,
        size: el.fontSize,
        font,
        color: hexToRgb(el.color),
        opacity: el.opacity,
        rotate: degrees(el.rotation || 0),
        maxWidth: el.width,
      });
    }

    if (el.underline) {
      page.drawLine({
        start: { x: Math.max(0, x), y: cursorY - 2 },
        end: { x: Math.max(0, x) + textWidth, y: cursorY - 2 },
        thickness: Math.max(0.6, el.fontSize / 16),
        color: hexToRgb(el.color),
        opacity: el.opacity,
      });
    }
    cursorY -= lineHeight;
  }
}

async function drawRect(page: PDFPage, el: RectElement, pageHeight: number) {
  const y = toPdfY(pageHeight, el.y, el.height);
  if (el.cornerRadius > 0) {
    page.drawSvgPath(roundedRectPath(el.x, y, el.width, el.height, el.cornerRadius), {
      color: hexToRgb(el.fill),
      borderColor: hexToRgb(el.stroke),
      borderWidth: el.strokeWidth,
      opacity: el.opacity,
      borderOpacity: el.opacity,
    });
    return;
  }
  page.drawRectangle({
    x: el.x,
    y,
    width: el.width,
    height: el.height,
    color: hexToRgb(el.fill),
    borderColor: hexToRgb(el.stroke),
    borderWidth: el.strokeWidth,
    opacity: el.opacity,
    borderOpacity: el.opacity,
    rotate: degrees(el.rotation || 0),
  });
}

async function drawEllipse(page: PDFPage, el: EllipseElement, pageHeight: number) {
  page.drawEllipse({
    x: el.x + el.width / 2,
    y: toPdfY(pageHeight, el.y, el.height) + el.height / 2,
    xScale: el.width / 2,
    yScale: el.height / 2,
    color: hexToRgb(el.fill),
    borderColor: hexToRgb(el.stroke),
    borderWidth: el.strokeWidth,
    opacity: el.opacity,
    borderOpacity: el.opacity,
    rotate: degrees(el.rotation || 0),
  });
}

async function drawLine(page: PDFPage, el: LineElement, pageHeight: number) {
  page.drawLine({
    start: { x: el.x, y: toPdfY(pageHeight, el.y, 0) },
    end: { x: el.x + el.width, y: toPdfY(pageHeight, el.y + el.height, 0) },
    thickness: el.strokeWidth,
    color: hexToRgb(el.stroke),
    opacity: el.opacity,
  });
}

async function drawArrow(page: PDFPage, el: ArrowElement, pageHeight: number) {
  const x1 = el.x;
  const y1 = toPdfY(pageHeight, el.y + el.height / 2, 0);
  const x2 = el.x + el.width;
  const y2 = y1;
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2 - el.headSize, y: y2 },
    thickness: el.strokeWidth,
    color: hexToRgb(el.stroke),
    opacity: el.opacity,
  });
  const hs = el.headSize;
  page.drawSvgPath(`M ${x2} ${y2} L ${x2 - hs} ${y2 + hs * 0.6} L ${x2 - hs} ${y2 - hs * 0.6} Z`, {
    color: hexToRgb(el.stroke),
    opacity: el.opacity,
  });
}

async function drawSticky(page: PDFPage, el: StickyElement, pageHeight: number, fonts: Fonts) {
  const y = toPdfY(pageHeight, el.y, el.height);
  page.drawRectangle({
    x: el.x,
    y,
    width: el.width,
    height: el.height,
    color: hexToRgb(el.fill),
    opacity: el.opacity,
    rotate: degrees(el.rotation || 0),
  });
  const lines = (el.content || "").split("\n").slice(0, 8);
  let cursorY = y + el.height - el.fontSize - 10;
  for (const line of lines) {
    page.drawText(line, {
      x: el.x + 10,
      y: cursorY,
      size: el.fontSize,
      font: fonts.helvetica,
      color: hexToRgb(el.color),
      opacity: el.opacity,
      maxWidth: el.width - 20,
    });
    cursorY -= el.fontSize * 1.3;
  }
}

async function drawBadge(page: PDFPage, el: BadgeElement, pageHeight: number, fonts: Fonts) {
  const y = toPdfY(pageHeight, el.y, el.height);
  const r = el.height / 2;
  page.drawSvgPath(roundedRectPath(el.x, y, el.width, el.height, r), {
    color: hexToRgb(el.fill),
    opacity: el.opacity,
  });
  const textWidth = fonts.helveticaBold.widthOfTextAtSize(el.label, el.fontSize);
  page.drawText(el.label, {
    x: el.x + (el.width - textWidth) / 2,
    y: y + (el.height - el.fontSize) / 2,
    size: el.fontSize,
    font: fonts.helveticaBold,
    color: hexToRgb(el.color),
    opacity: el.opacity,
  });
}

async function drawCheckbox(page: PDFPage, el: CheckboxElement, pageHeight: number, fonts: Fonts) {
  const box = Math.min(el.height - 4, 16);
  const y = toPdfY(pageHeight, el.y + (el.height - box) / 2, box);
  page.drawRectangle({
    x: el.x,
    y,
    width: box,
    height: box,
    borderColor: hexToRgb(el.color),
    borderWidth: 1.5,
    opacity: el.opacity,
  });
  if (el.checked) {
    page.drawText("X", {
      x: el.x + 3,
      y: y + 2,
      size: box - 4,
      font: fonts.helveticaBold,
      color: hexToRgb(el.color),
      opacity: el.opacity,
    });
  }
  page.drawText(el.label, {
    x: el.x + box + 8,
    y: toPdfY(pageHeight, el.y + (el.height - el.fontSize) / 2, el.fontSize),
    size: el.fontSize,
    font: fonts.helvetica,
    color: hexToRgb(el.color),
    opacity: el.opacity,
    maxWidth: el.width - box - 10,
  });
}

async function drawDivider(page: PDFPage, el: DividerElement, pageHeight: number) {
  const y = toPdfY(pageHeight, el.y + el.height / 2, 0);
  if (el.style === "dashed") {
    const dash = 8;
    const gap = 6;
    let x = el.x;
    while (x < el.x + el.width) {
      const end = Math.min(x + dash, el.x + el.width);
      page.drawLine({
        start: { x, y },
        end: { x: end, y },
        thickness: el.strokeWidth,
        color: hexToRgb(el.stroke),
        opacity: el.opacity,
      });
      x += dash + gap;
    }
  } else {
    page.drawLine({
      start: { x: el.x, y },
      end: { x: el.x + el.width, y },
      thickness: el.strokeWidth,
      color: hexToRgb(el.stroke),
      opacity: el.opacity,
    });
  }
}

async function drawIcon(page: PDFPage, el: IconElement, pageHeight: number, fonts: Fonts) {
  const symbols: Record<string, string> = {
    star: "*",
    heart: "♥",
    check: "✓",
    x: "X",
    warning: "!",
    info: "i",
    mail: "@",
    phone: "☎",
    pin: "•",
    user: "☺",
  };
  const label = symbols[el.icon] ?? "*";
  const size = Math.min(el.width, el.height) * 0.7;
  const textWidth = fonts.helveticaBold.widthOfTextAtSize(label, size);
  page.drawText(label, {
    x: el.x + (el.width - textWidth) / 2,
    y: toPdfY(pageHeight, el.y + (el.height - size) / 2, size),
    size,
    font: fonts.helveticaBold,
    color: hexToRgb(el.color),
    opacity: el.opacity,
  });
}

async function drawTable(page: PDFPage, el: TableElement, pageHeight: number, fonts: Fonts) {
  const yTop = toPdfY(pageHeight, el.y, el.height);
  const cellW = el.width / el.cols;
  const cellH = el.height / el.rows;

  for (let r = 0; r < el.rows; r++) {
    for (let c = 0; c < el.cols; c++) {
      const x = el.x + c * cellW;
      const y = yTop + (el.rows - 1 - r) * cellH;
      const isHeader = el.header && r === 0;
      page.drawRectangle({
        x,
        y,
        width: cellW,
        height: cellH,
        color: hexToRgb(isHeader ? el.headerFill : el.fill),
        borderColor: hexToRgb(el.stroke),
        borderWidth: 0.8,
        opacity: el.opacity,
      });
      const text = el.cells[r * el.cols + c] ?? "";
      page.drawText(text.slice(0, 40), {
        x: x + 4,
        y: y + (cellH - el.fontSize) / 2,
        size: el.fontSize,
        font: isHeader ? fonts.helveticaBold : fonts.helvetica,
        color: hexToRgb(isHeader ? "#ffffff" : el.color),
        opacity: el.opacity,
        maxWidth: cellW - 8,
      });
    }
  }
}

async function drawStamp(page: PDFPage, el: StampElement, pageHeight: number, fonts: Fonts) {
  const cx = el.x + el.width / 2;
  const cy = toPdfY(pageHeight, el.y, el.height) + el.height / 2;
  const radius = Math.min(el.width, el.height) / 2;
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: radius,
    yScale: radius,
    borderColor: hexToRgb(el.color),
    borderWidth: 4,
    opacity: el.opacity,
  });
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: radius - 8,
    yScale: radius - 8,
    borderColor: hexToRgb(el.color),
    borderWidth: 1.5,
    opacity: el.opacity,
  });
  const textWidth = fonts.helveticaBold.widthOfTextAtSize(el.label, el.fontSize);
  page.drawText(el.label, {
    x: cx - textWidth / 2,
    y: cy - el.fontSize / 3,
    size: el.fontSize,
    font: fonts.helveticaBold,
    color: hexToRgb(el.color),
    opacity: el.opacity,
    rotate: degrees(el.rotation || 0),
  });
}

async function drawImage(
  doc: PDFDocument,
  page: PDFPage,
  el: ImageElement | SignatureElement,
  pageHeight: number,
  quality = 0.85,
) {
  const filePath = resolveUploadPath(el.src);
  if (!filePath) return;
  let bytes: Buffer;
  try {
    bytes = await fs.readFile(filePath);
  } catch {
    return;
  }
  const isJpg = /\.jpe?g$/i.test(filePath);
  const isPng = /\.png$/i.test(filePath);
  if (!isJpg && !isPng) return;
  const image = isJpg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
  void quality;
  page.drawImage(image, {
    x: el.x,
    y: toPdfY(pageHeight, el.y, el.height),
    width: el.width,
    height: el.height,
    opacity: el.opacity,
    rotate: degrees(el.rotation || 0),
  });
}

function drawFormTextPreview(page: PDFPage, el: FormTextElement, pageHeight: number, fonts: Fonts) {
  const y = toPdfY(pageHeight, el.y, el.height);
  page.drawRectangle({
    x: el.x,
    y,
    width: el.width,
    height: el.height,
    borderColor: hexToRgb(el.borderColor),
    borderWidth: 1,
    color: rgb(1, 1, 1),
    opacity: el.opacity,
  });
  page.drawText(el.placeholder || "", {
    x: el.x + 4,
    y: y + (el.height - el.fontSize) / 2,
    size: el.fontSize,
    font: fonts.helvetica,
    color: hexToRgb("#94a3b8"),
    opacity: el.opacity * 0.8,
    maxWidth: el.width - 8,
  });
}

async function addFormFields(
  doc: PDFDocument,
  page: PDFPage,
  el: PdfElement,
  pageHeight: number,
  fonts: Fonts,
) {
  const form = doc.getForm();
  if (el.type === "formText") {
    drawFormTextPreview(page, el, pageHeight, fonts);
    const field = form.createTextField(el.name || el.id);
    field.addToPage(page, {
      x: el.x,
      y: toPdfY(pageHeight, el.y, el.height),
      width: el.width,
      height: el.height,
      textColor: hexToRgb(el.color),
      borderColor: hexToRgb(el.borderColor),
      backgroundColor: rgb(1, 1, 1),
      borderWidth: 1,
    });
    field.setFontSize(el.fontSize);
    if (el.multiline) field.enableMultiline();
    field.setText("");
    return;
  }
  if (el.type === "formCheck") {
    const box = Math.min(el.height - 2, 16);
    const check = form.createCheckBox(el.name || el.id);
    check.addToPage(page, {
      x: el.x,
      y: toPdfY(pageHeight, el.y + (el.height - box) / 2, box),
      width: box,
      height: box,
      borderColor: hexToRgb(el.color),
      borderWidth: 1,
    });
    if (el.checked) check.check();
    page.drawText(el.label, {
      x: el.x + box + 8,
      y: toPdfY(pageHeight, el.y + (el.height - el.fontSize) / 2, el.fontSize),
      size: el.fontSize,
      font: fonts.helvetica,
      color: hexToRgb(el.color),
      opacity: el.opacity,
      maxWidth: el.width - box - 10,
    });
    return;
  }
  if (el.type === "formSelect") {
    const y = toPdfY(pageHeight, el.y, el.height);
    page.drawRectangle({
      x: el.x,
      y,
      width: el.width,
      height: el.height,
      borderColor: hexToRgb(el.borderColor),
      borderWidth: 1,
      color: rgb(1, 1, 1),
      opacity: el.opacity,
    });
    const dropdown = form.createDropdown(el.name || el.id);
    dropdown.addOptions(el.options.length ? el.options : ["Option"]);
    dropdown.select(el.options[0] || "Option");
    dropdown.addToPage(page, {
      x: el.x,
      y,
      width: el.width,
      height: el.height,
      textColor: hexToRgb(el.color),
      borderColor: hexToRgb(el.borderColor),
      backgroundColor: rgb(1, 1, 1),
      borderWidth: 1,
    });
    dropdown.setFontSize(el.fontSize);
  }
}

async function drawWatermark(
  doc: PDFDocument,
  page: PDFPage,
  watermark: DocWatermark,
  pageWidth: number,
  pageHeight: number,
  fonts: Fonts,
) {
  if (watermark.type === "text" && watermark.text) {
    const size = watermark.fontSize || 48;
    const text = watermark.text;
    const tw = fonts.helveticaBold.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - tw) / 2,
      y: pageHeight / 2,
      size,
      font: fonts.helveticaBold,
      color: hexToRgb(watermark.color || "#94a3b8"),
      opacity: watermark.opacity ?? 0.15,
      rotate: degrees(watermark.rotation || -30),
    });
    return;
  }
  if (watermark.type === "image" && watermark.src) {
    const filePath = resolveUploadPath(watermark.src);
    if (!filePath) return;
    try {
      const bytes = await fs.readFile(filePath);
      const isJpg = /\.jpe?g$/i.test(filePath);
      const image = isJpg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      const w = pageWidth * 0.5;
      const h = (image.height / image.width) * w;
      page.drawImage(image, {
        x: (pageWidth - w) / 2,
        y: (pageHeight - h) / 2,
        width: w,
        height: h,
        opacity: watermark.opacity ?? 0.12,
        rotate: degrees(watermark.rotation || 0),
      });
    } catch {
      /* ignore */
    }
  }
}

async function drawElement(
  doc: PDFDocument,
  page: PDFPage,
  el: PdfElement,
  pageHeight: number,
  fonts: Fonts,
  pageIndex: number,
  pageCount: number,
  imageQuality: number,
) {
  switch (el.type) {
    case "text":
      await drawText(page, el, pageHeight, fonts, pageIndex, pageCount);
      break;
    case "rect":
      await drawRect(page, el, pageHeight);
      break;
    case "ellipse":
      await drawEllipse(page, el, pageHeight);
      break;
    case "line":
      await drawLine(page, el, pageHeight);
      break;
    case "image":
    case "signature":
      await drawImage(doc, page, el, pageHeight, imageQuality);
      break;
    case "arrow":
      await drawArrow(page, el, pageHeight);
      break;
    case "sticky":
      await drawSticky(page, el, pageHeight, fonts);
      break;
    case "badge":
      await drawBadge(page, el, pageHeight, fonts);
      break;
    case "checkbox":
      await drawCheckbox(page, el, pageHeight, fonts);
      break;
    case "divider":
      await drawDivider(page, el, pageHeight);
      break;
    case "icon":
      await drawIcon(page, el, pageHeight, fonts);
      break;
    case "table":
      await drawTable(page, el, pageHeight, fonts);
      break;
    case "stamp":
      await drawStamp(page, el, pageHeight, fonts);
      break;
    case "formText":
    case "formCheck":
    case "formSelect":
      await addFormFields(doc, page, el, pageHeight, fonts);
      break;
  }
}

export async function exportPdf(payload: ExportPayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc, payload.customFonts);
  const size = PAGE_SIZES[payload.pageSize] ?? PAGE_SIZES.a4;
  const settings = payload.exportSettings || {
    margin: 0,
    imageQuality: 0.85,
    flatten: false,
    pdfaLite: false,
  };
  const pageCount = payload.pages.length;

  let sourcePdf: PDFDocument | null = null;
  if (payload.importedPdf?.url) {
    const srcPath = resolveUploadPath(payload.importedPdf.url);
    if (srcPath) {
      try {
        const bytes = await fs.readFile(srcPath);
        sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        sourcePdf = null;
      }
    }
  }

  if (settings.pdfaLite) {
    doc.setTitle(payload.name || "Document");
    doc.setProducer("PDF Studio");
    doc.setCreator("PDF Studio");
    doc.setCreationDate(new Date());
  }

  for (let pageIndex = 0; pageIndex < payload.pages.length; pageIndex++) {
    const pdfPage = payload.pages[pageIndex];
    const page = doc.addPage([size.width, size.height]);
    const bg = payload.pageBackground || "#ffffff";
    page.drawRectangle({
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      color: hexToRgb(bg),
    });

    if (sourcePdf && typeof pdfPage.sourcePageIndex === "number") {
      try {
        const [embedded] = await doc.embedPdf(sourcePdf, [pdfPage.sourcePageIndex]);
        page.drawPage(embedded, {
          x: settings.margin,
          y: settings.margin,
          width: size.width - settings.margin * 2,
          height: size.height - settings.margin * 2,
        });
      } catch {
        /* ignore embed failure */
      }
    }

    if (payload.watermark) {
      await drawWatermark(doc, page, payload.watermark, size.width, size.height, fonts);
    }

    const applyMaster = pdfPage.applyMaster !== false;
    const masterEls = applyMaster
      ? [...(payload.master?.header || []), ...(payload.master?.footer || [])]
      : [];

    for (const el of masterEls) {
      const cloned = structuredClone(el) as PdfElement;
      if (cloned.type === "text") {
        cloned.content = substituteTokens(cloned.content, pageIndex, pageCount);
      }
      await drawElement(doc, page, cloned, size.height, fonts, pageIndex, pageCount, settings.imageQuality);
    }

    for (const el of pdfPage.elements) {
      const offsetEl = structuredClone(el) as PdfElement;
      if (settings.margin && offsetEl.type !== "image") {
        /* margin already applied to imported page; elements stay in page coords */
      }
      await drawElement(doc, page, offsetEl, size.height, fonts, pageIndex, pageCount, settings.imageQuality);
    }
  }

  if (settings.flatten) {
    try {
      doc.getForm().flatten();
    } catch {
      /* no form or flatten unsupported */
    }
  }

  return doc.save({ useObjectStreams: !settings.pdfaLite });
}
