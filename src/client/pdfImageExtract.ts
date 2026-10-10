import { OPS, Util, type PDFDocumentProxy, type PDFPageProxy } from "pdfjs-dist";
import type { ImageElement, PdfElement } from "../shared/types.js";
import { createImage } from "./factories.js";
import type { StudioPageTarget } from "./pdfTextExtract.js";

type ImageLike = {
  width: number;
  height: number;
  kind?: number;
  data?: Uint8ClampedArray | Uint8Array;
  bitmap?: ImageBitmap;
};

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

async function imageObjToDataUrl(img: ImageLike): Promise<string | null> {
  const w = img.width || 0;
  const h = img.height || 0;
  if (!w || !h) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
    return canvasToDataUrl(canvas) || null;
  }

  if (img.data) {
    const clamped =
      img.data instanceof Uint8ClampedArray
        ? img.data
        : new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.byteLength);
    // pdf.js ImageKind: 1=GRAYSCALE_1BPP, 2=RGB_24BPP, 3=RGBA_32BPP
    if (img.kind === 2 && clamped.length >= w * h * 3) {
      const rgba = new Uint8ClampedArray(w * h * 4);
      for (let i = 0, j = 0; i < w * h; i++, j += 3) {
        rgba[i * 4] = clamped[j];
        rgba[i * 4 + 1] = clamped[j + 1];
        rgba[i * 4 + 2] = clamped[j + 2];
        rgba[i * 4 + 3] = 255;
      }
      ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
    } else if (clamped.length >= w * h * 4) {
      ctx.putImageData(new ImageData(clamped.slice(0, w * h * 4), w, h), 0, 0);
    } else {
      return null;
    }
    return canvasToDataUrl(canvas) || null;
  }

  return null;
}

function getImageObject(page: PDFPageProxy, name: string): Promise<ImageLike | null> {
  return new Promise((resolve) => {
    try {
      page.objs.get(name, (data: unknown) => {
        resolve((data as ImageLike) || null);
      });
    } catch {
      resolve(null);
    }
  });
}

/** Best-effort extraction of embedded bitmaps as ImageElements (studio coords). */
export async function extractImagesFromPage(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  target: StudioPageTarget,
): Promise<ImageElement[]> {
  if (typeof document === "undefined") return [];
  if (pageIndex < 0 || pageIndex >= pdf.numPages) return [];

  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1, rotation: page.rotate });
  const sx = target.studioWidth / viewport.width;
  const sy = target.studioHeight / viewport.height;
  const opList = await page.getOperatorList();

  const stack: number[][] = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const out: ImageElement[] = [];
  let imgIndex = 0;

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i] as unknown[];

    if (fn === OPS.save) {
      stack.push(ctm.slice());
    } else if (fn === OPS.restore) {
      ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    } else if (fn === OPS.transform && Array.isArray(args) && args.length >= 6) {
      ctm = Util.transform(ctm, args as number[]);
    } else if (fn === OPS.paintImageXObject && typeof args[0] === "string") {
      const img = await getImageObject(page, args[0]);
      if (!img?.width || !img?.height) continue;
      const dataUrl = await imageObjToDataUrl(img);
      if (!dataUrl) continue;

      // Image space is unit square transformed by CTM (pdf user space)
      const x0 = ctm[4];
      const y0 = ctm[5];
      const widthPdf = Math.hypot(ctm[0], ctm[1]) || img.width;
      const heightPdf = Math.hypot(ctm[2], ctm[3]) || img.height;
      const x = x0 * sx;
      const y = (viewport.height - y0 - heightPdf) * sy;
      const width = Math.abs(widthPdf * sx);
      const height = Math.abs(heightPdf * sy);

      if (width < 8 || height < 8) continue;
      if (width > target.studioWidth * 1.2 || height > target.studioHeight * 1.2) continue;

      out.push(
        createImage(Math.max(0, x), Math.max(0, y), {
          src: dataUrl,
          name: `Embedded image ${++imgIndex}`,
          width: Math.round(width),
          height: Math.round(height),
        }),
      );
    }
  }

  return out.slice(0, 40);
}

/** Optional OCR for pages with no text layer (dynamic import — experimental). */
export async function ocrPageToTextElements(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  target: StudioPageTarget,
): Promise<PdfElement[]> {
  if (typeof document === "undefined") return [];
  try {
    const mod = await import("tesseract.js");
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    const renderTask = page.render({ canvasContext: ctx, viewport });
    await renderTask.promise;

    const result = await mod.recognize(canvas, "eng");
    const text = (result.data?.text || "").trim();
    if (!text) return [];

    const { createText } = await import("./factories.js");
    return [
      createText(40, 40, {
        content: text,
        fontSize: 11,
        width: target.studioWidth - 80,
        height: Math.min(target.studioHeight - 80, Math.max(120, text.split("\n").length * 16)),
        color: "#1a1815",
      }),
    ];
  } catch {
    return [];
  }
}
