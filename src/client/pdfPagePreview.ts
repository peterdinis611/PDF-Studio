/**
 * PDF page previews via EmbedPDF (PDFium). pdf.js is only a last-resort fallback
 * when PDFium cannot initialize — never permanently disables EmbedPDF.
 */
import {
  closeEmbedPdfDocument,
  ensureEmbedPdfDocument,
  getEmbedPdfEngine,
  getEmbedPdfStatus,
  isEmbedPdfReady,
  preloadEmbedPdfEngine,
} from "./embedPdfEngine.js";
import { openPdfJsDocument } from "./pdfJsDocument.js";
import type { PDFDocumentProxy } from "pdfjs-dist";

export { preloadEmbedPdfEngine, getEmbedPdfStatus, isEmbedPdfReady };

const pageCache = new Map<string, string>();
let bytesFingerprint = "";
const objectUrls: string[] = [];

let sharedPdf: PDFDocumentProxy | null = null;
let sharedFp = "";
let openTask: Promise<PDFDocumentProxy> | null = null;

/** Which rasterizer produced the last successful page image. */
let lastBackend: "embedpdf" | "pdfjs" | null = null;

export type PreviewPurpose = "thumb" | "canvas";

function fingerprint(bytes: Uint8Array): string {
  const n = bytes.byteLength;
  if (n === 0) return "0";
  return `${n}:${bytes[0]}:${bytes[Math.floor(n / 2)]}:${bytes[n - 1]}`;
}

function cacheKey(pageIndex: number, scale: number, purpose: PreviewPurpose): string {
  return `${purpose}:${pageIndex}@${scale}`;
}

function revokeCachedUrls(): void {
  for (const url of objectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
  objectUrls.length = 0;
}

export function invalidatePdfPreviewCache(): void {
  pageCache.clear();
  bytesFingerprint = "";
  revokeCachedUrls();
  void closeEmbedPdfDocument();
  openTask = null;
  if (sharedPdf) {
    void sharedPdf.destroy().catch(() => undefined);
    sharedPdf = null;
  }
  sharedFp = "";
}

export function getPdfPreviewBackend(): "embedpdf" | "pdfjs" | null {
  return lastBackend;
}

function devicePixelRatioSafe(): number {
  if (typeof window === "undefined") return 2;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
}

export function recommendedThumbScale(): number {
  const cssWidth = 288;
  const dpr = Math.max(2.5, devicePixelRatioSafe());
  return Math.min(2.4, (cssWidth * dpr) / 595);
}

export function recommendedCanvasUnderlayScale(zoom = 0.85): number {
  return Math.min(3.2, Math.max(1.75, zoom * devicePixelRatioSafe() * 1.65));
}

async function ensureSharedPdfJs(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const fp = fingerprint(bytes);
  if (sharedPdf && sharedFp === fp) return sharedPdf;
  if (openTask && sharedFp === fp) return openTask;

  if (sharedPdf) {
    void sharedPdf.destroy().catch(() => undefined);
    sharedPdf = null;
  }
  sharedFp = fp;
  openTask = openPdfJsDocument(bytes).then((pdf) => {
    sharedPdf = pdf;
    openTask = null;
    return pdf;
  });
  return openTask;
}

async function renderViaEmbedPdf(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<string> {
  const eng = await getEmbedPdfEngine();
  const doc = await ensureEmbedPdfDocument(bytes);
  const page = doc.pages[pageIndex];
  if (!page) throw new Error(`EmbedPDF: missing page ${pageIndex}`);

  const maxEdge = purpose === "thumb" ? 1600 : 3200;
  const pageW = Math.max(1, page.size?.width ?? 595);
  const pageH = Math.max(1, page.size?.height ?? 842);
  const fit = Math.min(1, maxEdge / Math.max(pageW * scale, pageH * scale));
  const scaleFactor = scale * fit;

  const blob = await eng
    .renderPage(doc, page, {
      scaleFactor,
      dpr: 1,
      imageType: purpose === "thumb" ? "image/png" : "image/jpeg",
      imageQuality: purpose === "thumb" ? 1 : 0.95,
      withAnnotations: true,
      withForms: true,
    })
    .toPromise();

  const url = URL.createObjectURL(blob);
  objectUrls.push(url);
  lastBackend = "embedpdf";
  return url;
}

async function renderViaPdfJs(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<string | null> {
  const pdf = await ensureSharedPdfJs(bytes);
  if (pageIndex < 0 || pageIndex >= pdf.numPages) return null;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const maxEdge = purpose === "thumb" ? 1600 : 3200;
  const rawW = Math.ceil(viewport.width);
  const rawH = Math.ceil(viewport.height);
  const fit = Math.min(1, maxEdge / Math.max(rawW, rawH));
  canvas.width = Math.max(1, Math.floor(rawW * fit));
  canvas.height = Math.max(1, Math.floor(rawH * fit));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const drawViewport = page.getViewport({ scale: scale * fit });
  await page.render({
    canvasContext: ctx,
    viewport: drawViewport,
    intent: "display",
  }).promise;

  lastBackend = "pdfjs";
  if (purpose === "thumb") {
    return canvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/jpeg", 0.95);
}

async function renderPageToUrl(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<string | null> {
  try {
    return await renderViaEmbedPdf(bytes, pageIndex, scale, purpose);
  } catch (err) {
    console.warn("[pdf-studio] EmbedPDF render failed (will retry next time)", err);
    try {
      return await renderViaPdfJs(bytes, pageIndex, scale, purpose);
    } catch {
      return null;
    }
  }
}

export function getCachedPdfPagePreview(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 1.5,
  purpose: PreviewPurpose = "canvas",
): string | null {
  const fp = fingerprint(bytes);
  if (fp !== bytesFingerprint) return null;
  return pageCache.get(cacheKey(pageIndex, scale, purpose)) ?? null;
}

export async function renderPdfPagePreview(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 1.5,
  purpose: PreviewPurpose = "canvas",
): Promise<string | null> {
  const fp = fingerprint(bytes);
  if (bytesFingerprint && bytesFingerprint !== fp) {
    invalidatePdfPreviewCache();
  }
  bytesFingerprint = fp;

  const key = cacheKey(pageIndex, scale, purpose);
  const cached = pageCache.get(key);
  if (cached) return cached;

  try {
    const url = await renderPageToUrl(bytes, pageIndex, scale, purpose);
    if (url) pageCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

export function prefetchPdfPagePreviews(
  bytes: Uint8Array,
  pageIndices: number[],
  scale = 1.75,
): void {
  for (const pageIndex of pageIndices) {
    if (pageIndex < 0) continue;
    if (getCachedPdfPagePreview(bytes, pageIndex, scale, "canvas")) continue;
    void renderPdfPagePreview(bytes, pageIndex, scale, "canvas");
  }
}

export async function renderPdfThumbsProgressive(
  bytes: Uint8Array,
  pageIndices: number[],
  scale: number,
  onPage: (pageIndex: number, dataUrl: string | null) => void,
  options?: { chunkSize?: number; signal?: { cancelled: boolean } },
): Promise<void> {
  const chunkSize = options?.chunkSize ?? 3;
  const signal = options?.signal;
  const fp = fingerprint(bytes);
  if (bytesFingerprint && bytesFingerprint !== fp) {
    invalidatePdfPreviewCache();
  }
  bytesFingerprint = fp;

  // Ensure PDFium is warm before the first thumb chunk
  try {
    await getEmbedPdfEngine();
  } catch {
    /* fallback path will handle renders */
  }

  for (let offset = 0; offset < pageIndices.length; offset += chunkSize) {
    if (signal?.cancelled) return;
    const chunk = pageIndices.slice(offset, offset + chunkSize);
    await Promise.all(
      chunk.map(async (pageIndex) => {
        if (signal?.cancelled) return;
        const key = cacheKey(pageIndex, scale, "thumb");
        const cached = pageCache.get(key);
        if (cached) {
          onPage(pageIndex, cached);
          return;
        }
        try {
          const url = await renderPageToUrl(bytes, pageIndex, scale, "thumb");
          if (url) pageCache.set(key, url);
          onPage(pageIndex, url);
        } catch {
          onPage(pageIndex, null);
        }
      }),
    );
    await new Promise((r) => setTimeout(r, 0));
  }
}
