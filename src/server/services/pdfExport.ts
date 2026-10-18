import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
  PDFString,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PAGE_SIZES,
  type ArrowElement,
  type BadgeElement,
  type CheckboxElement,
  type DividerElement,
  type DocComment,
  type ExportPayload,
  type EllipseElement,
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
import { markdownToPlainText, markdownToStyledLines } from "../../shared/markdown.js";
import { richHtmlToPlainText, richHtmlToStyledLines } from "../../shared/richText.js";
import {
  resolveFlattenAnnotations,
  resolveFlattenForms,
  resolvePdfaMode,
} from "../../shared/exportSettings.js";
import { applyPdfaDocumentHints } from "./pdfa.js";
import {
  findUrlsInText,
  substituteElementTokens,
  substituteTokens,
  type TokenContext,
} from "../../shared/tokens.js";
import { resolveUploadPath, base64ToBytes } from "./pdfImport.js";
import {
  embedCustomFonts,
  embedGoogleFonts,
  pickCustomFont,
  pickGoogleFont,
  type FontNeed,
} from "./fontEmbed.js";

export { substituteTokens };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");

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
  google: Map<string, PDFFont>;
  custom: Map<string, PDFFont>;
};

/** Exported for unit tests. */
export function hexToRgb(hex: string) {
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

async function loadFonts(
  doc: PDFDocument,
  needs: FontNeed[] = [],
  customFonts?: { id: string; name: string; url: string }[],
): Promise<Fonts> {
  const google = await embedGoogleFonts(doc, needs);
  const custom = await embedCustomFonts(doc, customFonts, needs, resolveUploadPath);
  return {
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
    google,
    custom,
  };
}

function pickFont(fonts: Fonts, family: string, bold: boolean, italic: boolean): PDFFont {
  const google = pickGoogleFont(fonts.google, family, bold, italic);
  if (google) return google;

  const custom = pickCustomFont(fonts.custom, family);
  if (custom) return custom;

  // Missing custom upload → fall back to Helvetica
  if (family.startsWith("custom:")) {
    if (bold && italic) return fonts.helveticaBoldOblique;
    if (bold) return fonts.helveticaBold;
    if (italic) return fonts.helveticaOblique;
    return fonts.helvetica;
  }

  if (family === "Times-Roman") {
    if (bold && italic) return fonts.timesBoldItalic;
    if (bold) return fonts.timesBold;
    if (italic) return fonts.timesItalic;
    return fonts.times;
  }
  if (family === "Courier") {
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

function collectFontNeeds(payload: ExportPayload): FontNeed[] {
  const needs: FontNeed[] = [];
  const seen = new Set<string>();
  const push = (family: string, bold: boolean, italic: boolean) => {
    const key = `${family}:${bold}:${italic}`;
    if (seen.has(key)) return;
    seen.add(key);
    needs.push({ family, bold, italic });
  };

  const walk = (
    els: { type: string; fontFamily?: string; fontWeight?: string; fontStyle?: string }[],
  ) => {
    for (const el of els) {
      if (el.type === "text" && el.fontFamily) {
        push(el.fontFamily, el.fontWeight === "bold", el.fontStyle === "italic");
      }
    }
  };

  for (const page of payload.pages) walk(page.elements);
  if (payload.master) {
    walk(payload.master.header || []);
    walk(payload.master.footer || []);
  }
  return needs;
}

function formatTextLines(
  el: TextElement,
  pageIndex: number,
  pageCount: number,
  fields?: TokenContext,
): string[] {
  let content = el.rich
    ? richHtmlToPlainText(el.content || "")
    : el.markdown
      ? markdownToPlainText(el.content || "")
      : el.content || "";
  content = substituteTokens(content, pageIndex, pageCount, fields);
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

function addUriLink(
  doc: PDFDocument,
  page: PDFPage,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  try {
    const safe = url.trim();
    if (!/^https?:\/\//i.test(safe)) return;
    const annot = doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + Math.max(8, width), y + Math.max(8, height)],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of(safe),
      },
    });
    page.node.addAnnot(doc.context.register(annot));
  } catch {
    /* ignore link failures */
  }
}

async function drawText(
  doc: PDFDocument,
  page: PDFPage,
  el: TextElement,
  pageHeight: number,
  fonts: Fonts,
  pageIndex: number,
  pageCount: number,
) {
  if (el.rich) {
    await drawRichText(doc, page, el, pageHeight, fonts, pageIndex, pageCount);
    return;
  }
  if (el.markdown) {
    await drawMarkdownText(doc, page, el, pageHeight, fonts, pageIndex, pageCount);
    return;
  }

  const font = pickFont(fonts, el.fontFamily, el.fontWeight === "bold", el.fontStyle === "italic");
  const lines = formatTextLines(el, pageIndex, pageCount);
  const lineHeight = el.fontSize * (el.lineHeight || 1.25);
  let cursorY = toPdfY(pageHeight, el.y, el.fontSize);
  const plain = lines.join("\n");

  for (const line of lines) {
    const textWidth =
      font.widthOfTextAtSize(line, el.fontSize) +
      (el.letterSpacing || 0) * Math.max(0, line.length - 1);
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

    for (const hit of findUrlsInText(line)) {
      const before = line.slice(0, hit.index);
      const prefixW = font.widthOfTextAtSize(before, el.fontSize);
      const linkW = font.widthOfTextAtSize(line.slice(hit.index, hit.index + hit.length), el.fontSize);
      addUriLink(doc, page, hit.url, Math.max(0, x) + prefixW, cursorY - 2, linkW, el.fontSize + 4);
    }

    cursorY -= lineHeight;
  }

  if (el.href) {
    addUriLink(doc, page, el.href, el.x, toPdfY(pageHeight, el.y, el.height), el.width, el.height);
  } else if (!findUrlsInText(plain).length) {
    // markdown-style [label](url) single link on whole box
    const md = plain.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    if (md) {
      addUriLink(doc, page, md[2], el.x, toPdfY(pageHeight, el.y, el.height), el.width, el.height);
    }
  }
}

async function drawRichText(
  doc: PDFDocument,
  page: PDFPage,
  el: TextElement,
  pageHeight: number,
  fonts: Fonts,
  pageIndex: number,
  pageCount: number,
) {
  const source = substituteTokens(el.content || "", pageIndex, pageCount);
  const styled = richHtmlToStyledLines(source);
  let cursorY = toPdfY(pageHeight, el.y, el.fontSize);
  const baseSize = el.fontSize;
  const baseLh = el.lineHeight || 1.25;

  for (const line of styled) {
    const size = Math.max(6, baseSize * (line.sizeScale || 1) * (line.codeBlock ? 0.9 : 1));
    const lineHeight = size * baseLh;
    const runs =
      line.runs && line.runs.length
        ? line.runs
        : [{ text: line.text || "", bold: line.bold, italic: line.italic }];

    let textWidth = 0;
    for (const run of runs) {
      const bold = Boolean(run.bold) || el.fontWeight === "bold" || Boolean(line.sizeScale && line.sizeScale > 1);
      const italic = Boolean(run.italic) || el.fontStyle === "italic" || Boolean(line.quote);
      const family = run.code || line.codeBlock ? "Courier" : el.fontFamily;
      const font = pickFont(fonts, family, bold, italic);
      textWidth += font.widthOfTextAtSize(run.text, size);
    }

    let x = el.x + (line.quote ? 10 : 0);
    if (el.align === "center") x = el.x + (el.width - textWidth) / 2;
    if (el.align === "right") x = el.x + el.width - textWidth;
    let cx = Math.max(0, x);

    if (line.quote) {
      page.drawRectangle({
        x: el.x,
        y: cursorY - 2,
        width: 2.5,
        height: size,
        color: hexToRgb(el.color),
        opacity: Math.min(el.opacity, 0.45),
      });
    }

    for (const run of runs) {
      if (!run.text) continue;
      const bold = Boolean(run.bold) || el.fontWeight === "bold" || Boolean(line.sizeScale && line.sizeScale > 1);
      const italic = Boolean(run.italic) || el.fontStyle === "italic" || Boolean(line.quote);
      const family = run.code || line.codeBlock ? "Courier" : el.fontFamily;
      const font = pickFont(fonts, family, bold, italic);
      const color = run.color ? hexToRgb(run.color) : hexToRgb(el.color);
      page.drawText(run.text, {
        x: cx,
        y: cursorY,
        size,
        font,
        color,
        opacity: el.opacity,
        rotate: degrees(el.rotation || 0),
      });
      const w = font.widthOfTextAtSize(run.text, size);
      if (run.underline || el.underline) {
        page.drawLine({
          start: { x: cx, y: cursorY - 2 },
          end: { x: cx + w, y: cursorY - 2 },
          thickness: Math.max(0.5, size / 16),
          color,
          opacity: el.opacity,
        });
      }
      if (run.href) {
        addUriLink(doc, page, run.href, cx, cursorY - 2, w, size + 4);
      }
      cx += w;
    }

    cursorY -= lineHeight;
  }

  if (el.href) {
    addUriLink(doc, page, el.href, el.x, toPdfY(pageHeight, el.y, el.height), el.width, el.height);
  }
}

async function drawMarkdownText(
  doc: PDFDocument,
  page: PDFPage,
  el: TextElement,
  pageHeight: number,
  fonts: Fonts,
  pageIndex: number,
  pageCount: number,
) {
  const source = substituteTokens(el.content || "", pageIndex, pageCount);
  const styled = markdownToStyledLines(source);
  let cursorY = toPdfY(pageHeight, el.y, el.fontSize);
  const baseSize = el.fontSize;
  const baseLh = el.lineHeight || 1.25;

  for (const line of styled) {
    const size =
      line.headingLevel === 1
        ? baseSize * 1.55
        : line.headingLevel === 2
          ? baseSize * 1.35
          : line.headingLevel === 3
            ? baseSize * 1.18
            : baseSize;
    const lineHeight = size * baseLh;

    // Measure full line width for alignment
    let textWidth = 0;
    for (const run of line.runs) {
      const bold = Boolean(run.bold) || el.fontWeight === "bold" || Boolean(line.headingLevel);
      const italic = Boolean(run.italic) || el.fontStyle === "italic";
      const family = run.code ? "Courier" : el.fontFamily;
      const font = pickFont(fonts, family, bold, italic);
      textWidth += font.widthOfTextAtSize(run.text, size);
    }

    let x = el.x;
    if (el.align === "center") x = el.x + (el.width - textWidth) / 2;
    if (el.align === "right") x = el.x + el.width - textWidth;
    let cx = Math.max(0, x);

    for (const run of line.runs) {
      if (!run.text) continue;
      const bold = Boolean(run.bold) || el.fontWeight === "bold" || Boolean(line.headingLevel);
      const italic = Boolean(run.italic) || el.fontStyle === "italic";
      const family = run.code ? "Courier" : el.fontFamily;
      const font = pickFont(fonts, family, bold, italic);
      page.drawText(run.text, {
        x: cx,
        y: cursorY,
        size,
        font,
        color: hexToRgb(el.color),
        opacity: el.opacity,
        rotate: degrees(el.rotation || 0),
      });
      cx += font.widthOfTextAtSize(run.text, size);
    }

    cursorY -= lineHeight;
  }

  if (el.href) {
    addUriLink(doc, page, el.href, el.x, toPdfY(pageHeight, el.y, el.height), el.width, el.height);
  } else {
    for (const hit of findUrlsInText(source)) {
      addUriLink(doc, page, hit.url, el.x, toPdfY(pageHeight, el.y, el.height), el.width, el.height);
      break;
    }
    const md = source.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    if (md) {
      addUriLink(doc, page, md[2], el.x, toPdfY(pageHeight, el.y, el.height), el.width, el.height);
    }
  }
}

async function drawRect(page: PDFPage, el: RectElement, pageHeight: number) {
  const y = toPdfY(pageHeight, el.y, el.height);
  // Acrobat markup: underline / strike draw as a thin bar through the band
  if (el.markup === "underline" || el.markup === "strike") {
    const barH = Math.max(1.2, Math.min(el.height, 3.5));
    const barY =
      el.markup === "underline" ? y : y + (el.height - barH) / 2;
    page.drawRectangle({
      x: el.x,
      y: barY,
      width: el.width,
      height: barH,
      color: hexToRgb(el.fill || (el.markup === "strike" ? "#dc2626" : "#2563eb")),
      opacity: el.opacity ?? 0.95,
      rotate: degrees(el.rotation || 0),
    });
    return;
  }
  const fill = el.redact ? "#000000" : el.fill;
  const stroke = el.redact ? "#000000" : el.stroke;
  const opacity = el.redact ? 1 : el.markup === "highlight" ? Math.min(el.opacity ?? 0.45, 0.55) : el.opacity;
  if (el.cornerRadius > 0 && !el.redact) {
    page.drawSvgPath(roundedRectPath(el.x, y, el.width, el.height, el.cornerRadius), {
      color: hexToRgb(fill),
      borderColor: hexToRgb(stroke),
      borderWidth: el.strokeWidth,
      opacity,
      borderOpacity: opacity,
    });
    return;
  }
  page.drawRectangle({
    x: el.x,
    y,
    width: el.width,
    height: el.height,
    color: hexToRgb(fill),
    borderColor: hexToRgb(stroke),
    borderWidth: el.redact || el.markup === "highlight" ? 0 : el.strokeWidth,
    opacity,
    borderOpacity: opacity,
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
    calendar: "📅",
    link: "⛓",
    globe: "○",
    file: "▢",
    clock: "◷",
    image: "▦",
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

function decodeBase64Bytes(data: string): Uint8Array {
  const cleaned = data.includes(",") ? data.split(",").pop()! : data;
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(cleaned, "base64"));
  }
  const bin = atob(cleaned);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadImageBytes(src: string): Promise<{ bytes: Uint8Array; isJpg: boolean } | null> {
  if (src.startsWith("data:image/")) {
    try {
      const isJpg = /data:image\/jpe?g/i.test(src);
      return { bytes: decodeBase64Bytes(src), isJpg };
    } catch {
      return null;
    }
  }

  // Browser / isomorphic: fetch session uploads and remote URLs
  if (src.startsWith("/uploads/") || src.startsWith("http://") || src.startsWith("https://")) {
    try {
      if (typeof fetch !== "undefined") {
        const res = await fetch(src);
        if (res.ok) {
          const bytes = new Uint8Array(await res.arrayBuffer());
          const isJpg = /jpe?g/i.test(res.headers.get("content-type") || src);
          return { bytes, isJpg };
        }
      }
    } catch {
      /* fall through to disk */
    }
  }

  const filePath = resolveUploadPath(src);
  if (!filePath) return null;
  try {
    const bytes = await fs.readFile(filePath);
    const isJpg = /\.jpe?g$/i.test(filePath);
    const isPng = /\.png$/i.test(filePath);
    if (!isJpg && !isPng) return null;
    return { bytes, isJpg };
  } catch {
    return null;
  }
}

/** Re-encode bitmap via canvas when compressImages is on (worker / browser). */
async function compressImageBytes(
  bytes: Uint8Array,
  isJpg: boolean,
  quality: number,
): Promise<{ bytes: Uint8Array; isJpg: boolean }> {
  const q = Math.min(0.95, Math.max(0.35, quality));
  try {
    if (typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function") {
      const copy = bytes.slice();
      const ab = copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength) as ArrayBuffer;
      const blob = new Blob([ab], { type: isJpg ? "image/jpeg" : "image/png" });
      const bmp = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return { bytes, isJpg };
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const out = await canvas.convertToBlob({ type: "image/jpeg", quality: q });
      return { bytes: new Uint8Array(await out.arrayBuffer()), isJpg: true };
    }
    if (typeof document !== "undefined") {
      const copy = bytes.slice();
      const ab = copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([ab], { type: isJpg ? "image/jpeg" : "image/png" }));
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error("img"));
          el.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return { bytes, isJpg };
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", q);
        const raw = dataUrl.split(",")[1] || "";
        const bin = atob(raw);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return { bytes: out, isJpg: true };
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  } catch {
    /* keep original */
  }
  return { bytes, isJpg };
}

async function drawImage(
  doc: PDFDocument,
  page: PDFPage,
  el: ImageElement | SignatureElement,
  pageHeight: number,
  quality = 0.85,
  compress = false,
) {
  const loaded = await loadImageBytes(el.src);
  if (!loaded) return;
  let { bytes, isJpg } = loaded;
  if (compress && quality < 0.98) {
    ({ bytes, isJpg } = await compressImageBytes(bytes, isJpg, quality));
  }
  const image = isJpg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);

  const pdfY = toPdfY(pageHeight, el.y, el.height);
  const crop = el.type === "image" ? el.crop : undefined;
  const top = Math.min(40, Math.max(0, crop?.top ?? 0)) / 100;
  const right = Math.min(40, Math.max(0, crop?.right ?? 0)) / 100;
  const bottom = Math.min(40, Math.max(0, crop?.bottom ?? 0)) / 100;
  const left = Math.min(40, Math.max(0, crop?.left ?? 0)) / 100;
  const hasCrop = top + right + bottom + left > 0;
  const visW = Math.max(0.2, 1 - left - right);
  const visH = Math.max(0.2, 1 - top - bottom);

  if (hasCrop) {
    page.pushOperators(
      pushGraphicsState(),
      rectangle(el.x, pdfY, el.width, el.height),
      clip(),
      endPath(),
    );
    const drawW = el.width / visW;
    const drawH = el.height / visH;
    page.drawImage(image, {
      x: el.x - left * drawW,
      y: pdfY - bottom * drawH,
      width: drawW,
      height: drawH,
      opacity: el.opacity,
      rotate: degrees(el.rotation || 0),
    });
    page.pushOperators(popGraphicsState());
    return;
  }

  page.drawImage(image, {
    x: el.x,
    y: pdfY,
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
    color: hexToRgb("#a39a8e"),
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
      color: hexToRgb(watermark.color || "#a39a8e"),
      opacity: watermark.opacity ?? 0.15,
      rotate: degrees(watermark.rotation || -30),
    });
    return;
  }
  if (watermark.type === "image" && watermark.src) {
    const loaded = await loadImageBytes(watermark.src);
    if (!loaded) return;
    try {
      const image = loaded.isJpg
        ? await doc.embedJpg(loaded.bytes)
        : await doc.embedPng(loaded.bytes);
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

async function drawDocComment(page: PDFPage, c: DocComment, pageHeight: number, fonts: Fonts) {
  const w = 148;
  const h = 58;
  const y = toPdfY(pageHeight, c.y, h);
  page.drawRectangle({
    x: c.x,
    y,
    width: w,
    height: h,
    color: rgb(1, 0.95, 0.82),
    borderColor: rgb(0.85, 0.65, 0.2),
    borderWidth: 0.8,
    opacity: c.resolved ? 0.45 : 0.92,
  });
  const label = `${c.author}: ${c.body}`.slice(0, 140);
  page.drawText(label, {
    x: c.x + 6,
    y: y + h - 14,
    size: 8,
    font: fonts.helvetica,
    color: rgb(0.2, 0.15, 0.1),
    maxWidth: w - 12,
    opacity: c.resolved ? 0.55 : 1,
  });
  if (c.resolved) {
    page.drawText("resolved", {
      x: c.x + 6,
      y: y + 6,
      size: 7,
      font: fonts.helveticaOblique,
      color: rgb(0.4, 0.45, 0.35),
    });
  }
}

function isAnnotationLike(el: PdfElement): boolean {
  if (el.type === "stamp" || el.type === "badge") return true;
  if (el.type === "rect" && el.markup && !el.redact) return true;
  return false;
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
  compressImages = false,
  flattenAnnotations = true,
) {
  if (!flattenAnnotations && isAnnotationLike(el)) return;

  switch (el.type) {
    case "text":
      await drawText(doc, page, el, pageHeight, fonts, pageIndex, pageCount);
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
      await drawImage(doc, page, el, pageHeight, imageQuality, compressImages);
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
  const fonts = await loadFonts(doc, collectFontNeeds(payload), payload.customFonts);
  const size = PAGE_SIZES[payload.pageSize] ?? PAGE_SIZES.a4;
  const settings = payload.exportSettings || {
    margin: 0,
    imageQuality: 0.85,
    flatten: false,
    flattenForms: false,
    flattenAnnotations: true,
    pdfaLite: false,
    pdfaMode: "off" as const,
  };
  const flattenForms = resolveFlattenForms(settings);
  const flattenAnnotations = resolveFlattenAnnotations(settings);
  const pdfaMode = resolvePdfaMode(settings);
  const pdfaHints = applyPdfaDocumentHints(doc, pdfaMode, payload.name || "Document");
  const pageCount = payload.pages.length;

  let sourcePdf: PDFDocument | null = null;
  if (payload.importedPdfData) {
    try {
      const bytes = base64ToBytes(payload.importedPdfData);
      sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      sourcePdf = null;
    }
  } else if (payload.importedPdf?.url) {
    // Legacy path for older docs that still point at a temp upload URL
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

    // Editable imports already have extracted text as elements — skip source embed to avoid double text.
    const skipSourceEmbed = payload.importedPdf?.mode === "editable";
    if (!skipSourceEmbed && sourcePdf && typeof pdfPage.sourcePageIndex === "number") {
      try {
        const [embedded] = await doc.embedPdf(sourcePdf, [pdfPage.sourcePageIndex]);
        const crop = pdfPage.cropBox;
        const clampPct = (n: number) => Math.min(40, Math.max(0, n || 0)) / 100;
        const cTop = clampPct(crop?.top ?? 0);
        const cRight = clampPct(crop?.right ?? 0);
        const cBottom = clampPct(crop?.bottom ?? 0);
        const cLeft = clampPct(crop?.left ?? 0);
        const baseX = settings.margin;
        const baseY = settings.margin;
        const baseW = size.width - settings.margin * 2;
        const baseH = size.height - settings.margin * 2;
        if (cTop + cRight + cBottom + cLeft > 0) {
          const visW = Math.max(0.2, 1 - cLeft - cRight);
          const visH = Math.max(0.2, 1 - cTop - cBottom);
          page.pushOperators(
            pushGraphicsState(),
            rectangle(baseX, baseY, baseW, baseH),
            clip(),
            endPath(),
          );
          page.drawPage(embedded, {
            x: baseX - (cLeft / visW) * baseW,
            y: baseY - (cBottom / visH) * baseH,
            width: baseW / visW,
            height: baseH / visH,
          });
          page.pushOperators(popGraphicsState());
        } else {
          page.drawPage(embedded, {
            x: baseX,
            y: baseY,
            width: baseW,
            height: baseH,
          });
        }
      } catch {
        /* ignore embed failure */
      }
    }

    if (pdfPage.rotation) {
      page.setRotation(degrees(pdfPage.rotation));
    }

    if (payload.watermark && settings.includeWatermark !== false) {
      await drawWatermark(doc, page, payload.watermark, size.width, size.height, fonts);
    }

    const applyMaster = pdfPage.applyMaster !== false;
    const masterEls = applyMaster
      ? [...(payload.master?.header || []), ...(payload.master?.footer || [])]
      : [];

    const mergeFields = pdfPage.mergeFields;

    for (const el of masterEls) {
      if (el.visible === false) continue;
      const cloned = structuredClone(el) as PdfElement;
      substituteElementTokens(cloned, pageIndex, pageCount, mergeFields);
      await drawElement(
        doc,
        page,
        cloned,
        size.height,
        fonts,
        pageIndex,
        pageCount,
        settings.imageQuality,
        Boolean(settings.compressImages),
        flattenAnnotations,
      );
    }

    for (const el of pdfPage.elements) {
      if (el.visible === false) continue;
      const offsetEl = structuredClone(el) as PdfElement;
      substituteElementTokens(offsetEl, pageIndex, pageCount, mergeFields);
      if (settings.margin && offsetEl.type !== "image") {
        /* margin already applied to imported page; elements stay in page coords */
      }
      await drawElement(
        doc,
        page,
        offsetEl,
        size.height,
        fonts,
        pageIndex,
        pageCount,
        settings.imageQuality,
        Boolean(settings.compressImages),
        flattenAnnotations,
      );
    }

    if (settings.includeComments) {
      const pageComments = (payload.comments || []).filter((c) => c.pageId === pdfPage.id);
      for (const c of pageComments) {
        drawDocComment(page, c, size.height, fonts);
      }
    }
  }

  if (payload.bookmarks?.length) {
    try {
      const { writePdfBookmarks } = await import("./pdfOutline.js");
      writePdfBookmarks(doc, payload.bookmarks);
    } catch {
      /* outline optional */
    }
  }

  if (flattenForms) {
    try {
      doc.getForm().flatten();
    } catch {
      /* no form or flatten unsupported */
    }
  }

  const bytes = await doc.save({ useObjectStreams: pdfaHints.useObjectStreams });
  const password = payload.userPassword?.trim();
  if (password) {
    if (pdfaHints.blockEncryption) {
      throw new Error("PDF/A strict mode cannot be combined with password encryption");
    }
    const { encryptPdfBytes } = await import("./pdfEncrypt.js");
    return encryptPdfBytes(bytes, password);
  }
  return bytes;
}
