import { type PDFDocumentProxy, Util } from "pdfjs-dist";
import type { FontFamily, PdfElement, TextElement } from "../shared/types.js";
import { createText } from "./factories.js";
import { extractImagesFromPage, ocrPageToTextElements } from "./pdfImageExtract.js";

export type StudioPageTarget = {
  studioWidth: number;
  studioHeight: number;
};

export type TextRun = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  rotation: number;
  fontFamily: FontFamily;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
};

type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  fontName?: string;
};

export function mapPdfFontName(fontName: string | undefined): {
  fontFamily: FontFamily;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
} {
  const name = (fontName || "").toLowerCase();
  let fontFamily: FontFamily = "Helvetica";
  if (name.includes("times") || name.includes("georgia") || name.includes("serif")) {
    fontFamily = "Times-Roman";
  } else if (name.includes("courier") || name.includes("mono")) {
    fontFamily = "Courier";
  }

  const fontWeight = /bold|black|heavy|demi/.test(name) ? "bold" : "normal";
  const fontStyle = /italic|oblique/.test(name) ? "italic" : "normal";
  return { fontFamily, fontWeight, fontStyle };
}

function isTextItem(item: unknown): item is PdfTextItem {
  return Boolean(item && typeof item === "object" && "str" in item && "transform" in item);
}

/** Convert one pdf.js page of text items into studio-space runs (top-left origin). */
export async function extractTextRunsFromPage(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  target: StudioPageTarget,
): Promise<TextRun[]> {
  if (pageIndex < 0 || pageIndex >= pdf.numPages) return [];

  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
  const { items } = await page.getTextContent({ includeMarkedContent: false });

  const sx = target.studioWidth / viewport.width;
  const sy = target.studioHeight / viewport.height;
  const runs: TextRun[] = [];

  for (const raw of items) {
    if (!isTextItem(raw)) continue;
    const str = raw.str;
    if (!str?.trim()) continue;

    const tx = Util.transform(viewport.transform, raw.transform);
    const fontSizePdf = Math.hypot(tx[2], tx[3]) || Math.hypot(tx[0], tx[1]) || 12;
    const baselineX = tx[4];
    const baselineY = tx[5];
    const fontSize = fontSizePdf * sy;
    const width = Math.max((raw.width || 0) * sx, fontSize * 0.35 * str.length);
    const height = fontSize * 1.25;
    const x = baselineX * sx;
    const y = baselineY * sy - fontSize;
    const rotation = (Math.atan2(tx[1], tx[0]) * 180) / Math.PI;
    const fonts = mapPdfFontName(raw.fontName);

    runs.push({
      text: str,
      x,
      y: Math.max(0, y),
      width,
      height,
      fontSize: Math.max(6, Math.round(fontSize * 10) / 10),
      rotation: Math.abs(rotation) < 0.5 ? 0 : Math.round(rotation * 10) / 10,
      ...fonts,
    });
  }

  return runs;
}

/** Merge adjacent runs on the same baseline into editable lines. */
export function mergeRunsIntoLines(
  runs: TextRun[],
  opts?: { yTolerance?: number; xGapFactor?: number },
): TextRun[] {
  if (!runs.length) return [];

  const yTolerance = opts?.yTolerance ?? 0.35;
  const xGapFactor = opts?.xGapFactor ?? 0.55;
  const sorted = [...runs].sort((a, b) => {
    if (Math.abs(a.y - b.y) > Math.min(a.fontSize, b.fontSize) * yTolerance) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  const lines: TextRun[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const yTol = Math.max(current.fontSize, next.fontSize) * yTolerance;
    const sameLine = Math.abs(next.y - current.y) <= yTol;
    const gap = next.x - (current.x + current.width);
    const maxGap = Math.max(current.fontSize, next.fontSize) * xGapFactor;

    if (sameLine && gap >= -2 && gap <= maxGap) {
      const space = gap > Math.max(current.fontSize, next.fontSize) * 0.12 ? " " : "";
      const endX = Math.max(current.x + current.width, next.x + next.width);
      current = {
        ...current,
        text: `${current.text}${space}${next.text}`,
        width: endX - current.x,
        height: Math.max(current.height, next.height),
        fontSize: Math.max(current.fontSize, next.fontSize),
        y: Math.min(current.y, next.y),
      };
      continue;
    }

    lines.push(current);
    current = { ...next };
  }
  lines.push(current);
  return lines
    .map((line) => ({
      ...line,
      text: line.text.replace(/\s+/g, " ").trim(),
    }))
    .filter((line) => line.text.length > 0);
}

export function textRunsToElements(runs: TextRun[]): TextElement[] {
  return runs.map((run) =>
    createText(run.x, run.y, {
      content: run.text,
      fontSize: run.fontSize,
      fontFamily: run.fontFamily,
      fontWeight: run.fontWeight,
      fontStyle: run.fontStyle,
      width: Math.max(run.width + 4, run.fontSize * 2),
      height: Math.max(run.height, run.fontSize * 1.25),
      rotation: run.rotation,
      color: "#1a1815",
    }),
  );
}

export type ExtractEditableOptions = {
  /** When true and a page has no text, run experimental OCR (tesseract.js). */
  ocr?: boolean;
};

/** Extract + merge text and embedded images for every page. */
export async function extractEditablePages(
  pdf: PDFDocumentProxy,
  pageCount: number,
  target: StudioPageTarget,
  options: ExtractEditableOptions = {},
): Promise<PdfElement[][]> {
  const pages: PdfElement[][] = [];
  for (let i = 0; i < pageCount; i++) {
    const runs = await extractTextRunsFromPage(pdf, i, target);
    const textEls = textRunsToElements(mergeRunsIntoLines(runs));
    let images: PdfElement[] = [];
    try {
      images = await extractImagesFromPage(pdf, i, target);
    } catch {
      images = [];
    }
    let elements: PdfElement[] = [...images, ...textEls];
    if (options.ocr && textEls.length === 0) {
      const ocrEls = await ocrPageToTextElements(pdf, i, target);
      elements = [...images, ...ocrEls];
    }
    pages.push(elements);
  }
  return pages;
}
