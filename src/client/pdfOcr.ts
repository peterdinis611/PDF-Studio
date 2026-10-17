/**
 * Experimental OCR via self-hosted tesseract.js workers.
 * Hard timeouts so import never hangs on CDN/worker stalls.
 */
import type { PdfElement } from "../shared/types.js";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { StudioPageTarget } from "./pdfTextExtract.js";

const WORKER_PATH = "/public/js/tesseract/worker.min.js";
const CORE_PATH = "/public/js/tesseract/tesseract-core-simd-lstm.wasm.js";
const LANG_PATH = "/public/js/tesseract/lang";

/** Max pages to OCR in one import (experimental — keep snappy). */
export const OCR_MAX_PAGES = 3;
/** Per-page OCR budget. */
const OCR_PAGE_MS = 20_000;
/** Worker create + first lang load budget. */
const OCR_INIT_MS = 25_000;

type TessWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

let worker: TessWorker | null = null;
let workerPromise: Promise<TessWorker | null> | null = null;
let workerFailed = false;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function createOcrWorker(): Promise<TessWorker | null> {
  if (workerFailed) return null;
  if (worker) return worker;
  if (workerPromise) return workerPromise;

  workerPromise = (async () => {
    try {
      const mod = await import("tesseract.js");
      const created = await withTimeout(
        mod.createWorker("eng", 1, {
          workerPath: WORKER_PATH,
          corePath: CORE_PATH,
          langPath: LANG_PATH,
          workerBlobURL: false,
          gzip: true,
          logger: () => undefined,
          errorHandler: (err: unknown) => {
            console.warn("[pdf-studio] tesseract worker error", err);
          },
        }),
        OCR_INIT_MS,
        "OCR worker init",
      );
      worker = created as TessWorker;
      return worker;
    } catch (err) {
      console.warn("[pdf-studio] OCR unavailable", err);
      workerFailed = true;
      workerPromise = null;
      return null;
    }
  })();

  return workerPromise;
}

export async function terminateOcrWorker(): Promise<void> {
  const w = worker;
  worker = null;
  workerPromise = null;
  if (!w) return;
  try {
    await w.terminate();
  } catch {
    /* ignore */
  }
}

/** OCR one PDF page → a single text element (or []). Never throws. */
export async function ocrPageToTextElements(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  target: StudioPageTarget,
): Promise<PdfElement[]> {
  if (typeof document === "undefined") return [];
  try {
    const w = await createOcrWorker();
    if (!w) return [];

    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1.75 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(2000, Math.ceil(viewport.width));
    canvas.height = Math.min(2800, Math.ceil(viewport.height));
    const scale = Math.min(
      canvas.width / viewport.width,
      canvas.height / viewport.height,
    );
    const drawVp = page.getViewport({ scale: 1.75 * scale });
    canvas.width = Math.ceil(drawVp.width);
    canvas.height = Math.ceil(drawVp.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    await page.render({ canvasContext: ctx, viewport: drawVp }).promise;

    const result = await withTimeout(w.recognize(canvas), OCR_PAGE_MS, `OCR page ${pageIndex + 1}`);
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
  } catch (err) {
    console.warn(`[pdf-studio] OCR page ${pageIndex + 1} failed`, err);
    return [];
  }
}
