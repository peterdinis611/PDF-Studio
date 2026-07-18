import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
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
  type IconElement,
  type ImageElement,
  type LineElement,
  type PdfElement,
  type RectElement,
  type StampElement,
  type StickyElement,
  type TableElement,
  type TextElement,
} from "../../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const uploadsRoot = path.resolve(root, "uploads");

type Page = ReturnType<PDFDocument["addPage"]>;
type Fonts = Awaited<ReturnType<typeof loadFonts>>;

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

function resolveUploadPath(src: string): string | null {
  if (!src.startsWith("/uploads/")) return null;
  const filename = path.basename(src);
  if (!filename || filename !== src.replace(/^\/uploads\//, "")) return null;
  const resolved = path.resolve(uploadsRoot, filename);
  if (!resolved.startsWith(uploadsRoot + path.sep) && resolved !== uploadsRoot) return null;
  return resolved;
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

async function loadFonts(doc: PDFDocument) {
  return {
    helvetica: await doc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await doc.embedFont(StandardFonts.HelveticaBold),
    times: await doc.embedFont(StandardFonts.TimesRoman),
    timesBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    courier: await doc.embedFont(StandardFonts.Courier),
    courierBold: await doc.embedFont(StandardFonts.CourierBold),
  };
}

async function drawText(page: Page, el: TextElement, pageHeight: number, fonts: Fonts) {
  const fontKey =
    el.fontFamily === "Times-Roman"
      ? el.fontWeight === "bold"
        ? "timesBold"
        : "times"
      : el.fontFamily === "Courier"
        ? el.fontWeight === "bold"
          ? "courierBold"
          : "courier"
        : el.fontWeight === "bold"
          ? "helveticaBold"
          : "helvetica";

  const font = fonts[fontKey];
  const lines = (el.content || "").split("\n");
  const lineHeight = el.fontSize * 1.25;
  let cursorY = toPdfY(pageHeight, el.y, el.fontSize);

  for (const line of lines) {
    const textWidth = font.widthOfTextAtSize(line, el.fontSize);
    let x = el.x;
    if (el.align === "center") x = el.x + (el.width - textWidth) / 2;
    if (el.align === "right") x = el.x + el.width - textWidth;

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
    cursorY -= lineHeight;
  }
}

async function drawRect(page: Page, el: RectElement, pageHeight: number) {
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

async function drawEllipse(page: Page, el: EllipseElement, pageHeight: number) {
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

async function drawLine(page: Page, el: LineElement, pageHeight: number) {
  page.drawLine({
    start: { x: el.x, y: toPdfY(pageHeight, el.y, 0) },
    end: { x: el.x + el.width, y: toPdfY(pageHeight, el.y + el.height, 0) },
    thickness: el.strokeWidth,
    color: hexToRgb(el.stroke),
    opacity: el.opacity,
  });
}

async function drawArrow(page: Page, el: ArrowElement, pageHeight: number) {
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
  page.drawSvgPath(
    `M ${x2} ${y2} L ${x2 - hs} ${y2 + hs * 0.6} L ${x2 - hs} ${y2 - hs * 0.6} Z`,
    { color: hexToRgb(el.stroke), opacity: el.opacity },
  );
}

async function drawSticky(page: Page, el: StickyElement, pageHeight: number, fonts: Fonts) {
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

async function drawBadge(page: Page, el: BadgeElement, pageHeight: number, fonts: Fonts) {
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

async function drawCheckbox(page: Page, el: CheckboxElement, pageHeight: number, fonts: Fonts) {
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

async function drawDivider(page: Page, el: DividerElement, pageHeight: number) {
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

async function drawIcon(page: Page, el: IconElement, pageHeight: number, fonts: Fonts) {
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

async function drawTable(page: Page, el: TableElement, pageHeight: number, fonts: Fonts) {
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

async function drawStamp(page: Page, el: StampElement, pageHeight: number, fonts: Fonts) {
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

async function drawImage(doc: PDFDocument, page: Page, el: ImageElement, pageHeight: number) {
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
  page.drawImage(image, {
    x: el.x,
    y: toPdfY(pageHeight, el.y, el.height),
    width: el.width,
    height: el.height,
    opacity: el.opacity,
    rotate: degrees(el.rotation || 0),
  });
}

async function drawElement(
  doc: PDFDocument,
  page: Page,
  el: PdfElement,
  pageHeight: number,
  fonts: Fonts,
) {
  switch (el.type) {
    case "text":
      await drawText(page, el, pageHeight, fonts);
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
      await drawImage(doc, page, el, pageHeight);
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
  }
}

export async function exportPdf(payload: ExportPayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const size = PAGE_SIZES[payload.pageSize] ?? PAGE_SIZES.a4;

  for (const pdfPage of payload.pages) {
    const page = doc.addPage([size.width, size.height]);
    const bg = payload.pageBackground || "#ffffff";
    if (bg && bg.toLowerCase() !== "#ffffff" && bg.toLowerCase() !== "#faf9f6") {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        color: hexToRgb(bg),
      });
    } else if (bg && bg.toLowerCase() === "#faf9f6") {
      page.drawRectangle({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        color: hexToRgb(bg),
      });
    }
    for (const el of pdfPage.elements) {
      await drawElement(doc, page, el, size.height, fonts);
    }
  }

  return doc.save();
}
