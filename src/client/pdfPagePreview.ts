/**
 * PDF page previews via EmbedPDF (PDFium). pdf.js is only a last-resort fallback
 * when PDFium cannot initialize — never permanently disables EmbedPDF.
 *
 * Renders are serialized through a single queue (PDFium is main-thread WASM).
 * Thumbs use JPEG + lower max edge; canvas underlays stay high-quality JPEG.
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
/** Approximate decoded/transfer size for LRU budgeting (blob.size or estimate). */
const pageCacheBytes = new Map<string, number>();
let cacheByteTotal = 0;
/** Soft cap — ~48 MB of preview blobs before eviction. */
const CACHE_BUDGET_BYTES = 48 * 1024 * 1024;

let bytesFingerprint = "";
const objectUrls: string[] = [];

let sharedPdf: PDFDocumentProxy | null = null;
let sharedFp = "";
let openTask: Promise<PDFDocumentProxy> | null = null;

/** Which rasterizer produced the last successful page image. */
let lastBackend: "embedpdf" | "pdfjs" | null = null;

/** Serialize PDFium/pdf.js work — concurrent WASM renders jank the UI. */
let renderTail: Promise<unknown> = Promise.resolve();
let renderBusy = 0;
const inFlight = new Map<string, Promise<string | null>>();

export type PreviewPurpose = "thumb" | "canvas";

function fingerprint(bytes: Uint8Array): string {
  const n = bytes.byteLength;
  if (n === 0) return "0";
  return `${n}:${bytes[0]}:${bytes[Math.floor(n / 2)]}:${bytes[n - 1]}`;
}

function cacheKey(pageIndex: number, scale: number, purpose: PreviewPurpose): string {
  return `${purpose}:${pageIndex}@${scale.toFixed(3)}`;
}

function revokeUrl(url: string): void {
  if (!url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
  const idx = objectUrls.indexOf(url);
  if (idx >= 0) objectUrls.splice(idx, 1);
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

function trackBlobUrl(url: string, byteSize: number, key: string): void {
  objectUrls.push(url);
  pageCacheBytes.set(key, byteSize);
  cacheByteTotal += byteSize;
  evictIfNeeded(key);
}

function evictIfNeeded(keepKey: string): void {
  if (cacheByteTotal <= CACHE_BUDGET_BYTES) return;
  for (const key of pageCache.keys()) {
    if (key === keepKey) continue;
    if (cacheByteTotal <= CACHE_BUDGET_BYTES * 0.75) break;
    const url = pageCache.get(key);
    const size = pageCacheBytes.get(key) || 0;
    pageCache.delete(key);
    pageCacheBytes.delete(key);
    cacheByteTotal = Math.max(0, cacheByteTotal - size);
    if (url) revokeUrl(url);
  }
}

function enqueueRender<T>(fn: () => Promise<T>): Promise<T> {
  renderBusy += 1;
  const run = renderTail.then(fn, fn);
  renderTail = run.then(
    () => {
      renderBusy = Math.max(0, renderBusy - 1);
    },
    () => {
      renderBusy = Math.max(0, renderBusy - 1);
    },
  );
  return run;
}

export function isPdfPreviewQueueIdle(): boolean {
  return renderBusy === 0 && inFlight.size === 0;
}

export function invalidatePdfPreviewCache(): void {
  pageCache.clear();
  pageCacheBytes.clear();
  cacheByteTotal = 0;
  bytesFingerprint = "";
  inFlight.clear();
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

/** Rail / stack thumbs — keep under ~720 CSS px so JPEG stays small. */
export function recommendedThumbScale(): number {
  const cssWidth = 200;
  const dpr = Math.min(2, devicePixelRatioSafe());
  return Math.min(1.35, (cssWidth * dpr) / 595);
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

function canvasToBlobUrl(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<{ url: string; size: number }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas.toBlob failed"));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ url, size: blob.size });
      },
      type,
      quality,
    );
  });
}

async function renderViaEmbedPdf(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<{ url: string; size: number }> {
  const eng = await getEmbedPdfEngine();
  const doc = await ensureEmbedPdfDocument(bytes);
  const page = doc.pages[pageIndex];
  if (!page) throw new Error(`EmbedPDF: missing page ${pageIndex}`);

  const maxEdge = purpose === "thumb" ? 720 : 3200;
  const pageW = Math.max(1, page.size?.width ?? 595);
  const pageH = Math.max(1, page.size?.height ?? 842);
  const fit = Math.min(1, maxEdge / Math.max(pageW * scale, pageH * scale));
  const scaleFactor = scale * fit;

  const blob = await eng
    .renderPage(doc, page, {
      scaleFactor,
      dpr: 1,
      imageType: "image/jpeg",
      imageQuality: purpose === "thumb" ? 0.78 : 0.92,
      withAnnotations: true,
      withForms: true,
    })
    .toPromise();

  const url = URL.createObjectURL(blob);
  lastBackend = "embedpdf";
  return { url, size: blob.size };
}

async function renderViaPdfJs(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<{ url: string; size: number } | null> {
  const pdf = await ensureSharedPdfJs(bytes);
  if (pageIndex < 0 || pageIndex >= pdf.numPages) return null;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const maxEdge = purpose === "thumb" ? 720 : 3200;
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
  const type = "image/jpeg";
  const quality = purpose === "thumb" ? 0.78 : 0.92;
  return canvasToBlobUrl(canvas, type, quality);
}

async function renderPageToUrl(
  bytes: Uint8Array,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<{ url: string; size: number } | null> {
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
  const key = cacheKey(pageIndex, scale, purpose);
  const cached = pageCache.get(key);
  if (!cached) return null;
  // LRU touch
  pageCache.delete(key);
  pageCache.set(key, cached);
  return cached;
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
  if (cached) {
    pageCache.delete(key);
    pageCache.set(key, cached);
    return cached;
  }

  const existing = inFlight.get(key);
  if (existing) return existing;

  const task = enqueueRender(async () => {
    const again = pageCache.get(key);
    if (again) return again;
    try {
      const result = await renderPageToUrl(bytes, pageIndex, scale, purpose);
      if (!result) return null;
      pageCache.set(key, result.url);
      trackBlobUrl(result.url, result.size, key);
      return result.url;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  });

  inFlight.set(key, task);
  return task;
}

export function prefetchPdfPagePreviews(
  bytes: Uint8Array,
  pageIndices: number[],
  scale = 1.75,
): void {
  const run = () => {
    for (const pageIndex of pageIndices) {
      if (pageIndex < 0) continue;
      if (getCachedPdfPagePreview(bytes, pageIndex, scale, "canvas")) continue;
      void renderPdfPagePreview(bytes, pageIndex, scale, "canvas");
    }
  };
  // Defer neighbor warm-up so the active underlay finishes first.
  if (!isPdfPreviewQueueIdle()) {
    setTimeout(run, 80);
    return;
  }
  run();
}

export async function renderPdfThumbsProgressive(
  bytes: Uint8Array,
  pageIndices: number[],
  scale: number,
  onPage: (pageIndex: number, dataUrl: string | null) => void,
  options?: { chunkSize?: number; signal?: { cancelled: boolean } },
): Promise<void> {
  // Queue already serializes; keep chunks at 1 so Alpine gets steady progress
  // without stacking parallel WASM work.
  const chunkSize = Math.max(1, Math.min(options?.chunkSize ?? 1, 2));
  const signal = options?.signal;
  const fp = fingerprint(bytes);
  if (bytesFingerprint && bytesFingerprint !== fp) {
    invalidatePdfPreviewCache();
  }
  bytesFingerprint = fp;

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
        const url = await renderPdfPagePreview(bytes, pageIndex, scale, "thumb");
        if (signal?.cancelled) return;
        onPage(pageIndex, url);
      }),
    );
    // Yield to paint / input between chunks
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  }
}
