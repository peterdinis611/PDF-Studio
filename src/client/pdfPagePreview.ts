import { openPdfJsDocument } from "./pdfJsDocument.js";
import type { PDFDocumentProxy } from "pdfjs-dist";

const pageCache = new Map<string, string>();
let bytesFingerprint = "";
let sharedPdf: PDFDocumentProxy | null = null;
let sharedFp = "";
let openTask: Promise<PDFDocumentProxy> | null = null;

export type PreviewPurpose = "thumb" | "canvas";

function fingerprint(bytes: Uint8Array): string {
  const n = bytes.byteLength;
  if (n === 0) return "0";
  return `${n}:${bytes[0]}:${bytes[Math.floor(n / 2)]}:${bytes[n - 1]}`;
}

function cacheKey(pageIndex: number, scale: number, purpose: PreviewPurpose): string {
  return `${purpose}:${pageIndex}@${scale}`;
}

export function invalidatePdfPreviewCache(): void {
  pageCache.clear();
  bytesFingerprint = "";
  openTask = null;
  if (sharedPdf) {
    void sharedPdf.destroy().catch(() => undefined);
    sharedPdf = null;
  }
  sharedFp = "";
}

async function ensureSharedPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const fp = fingerprint(bytes);
  if (sharedPdf && sharedFp === fp) return sharedPdf;
  if (openTask && sharedFp === fp) return openTask;

  if (sharedPdf) {
    void sharedPdf.destroy().catch(() => undefined);
    sharedPdf = null;
  }
  pageCache.clear();
  bytesFingerprint = fp;
  sharedFp = fp;

  openTask = openPdfJsDocument(bytes).then((pdf) => {
    sharedPdf = pdf;
    openTask = null;
    return pdf;
  });
  return openTask;
}

function devicePixelRatioSafe(): number {
  if (typeof window === "undefined") return 2;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
}

/**
 * Rail ≈ 19rem / ~288 CSS px. Always render ≥2.5× CSS px so type stays sharp
 * on Retina (never infer “thumb vs canvas” from scale alone).
 */
export function recommendedThumbScale(): number {
  const cssWidth = 288;
  const dpr = Math.max(2.5, devicePixelRatioSafe());
  return Math.min(2.4, (cssWidth * dpr) / 595);
}

/** Target scale for the main canvas underlay at typical zoom. */
export function recommendedCanvasUnderlayScale(zoom = 0.85): number {
  return Math.min(3.2, Math.max(1.75, zoom * devicePixelRatioSafe() * 1.65));
}

async function renderPageToDataUrl(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  scale: number,
  purpose: PreviewPurpose,
): Promise<string | null> {
  if (pageIndex < 0 || pageIndex >= pdf.numPages) return null;
  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  // Thumbs: allow up to 1600px so high DPR scales are not downsampled soft
  const maxEdge = purpose === "thumb" ? 1600 : 3200;
  const rawW = Math.ceil(viewport.width);
  const rawH = Math.ceil(viewport.height);
  const fit = Math.min(1, maxEdge / Math.max(rawW, rawH));
  canvas.width = Math.max(1, Math.floor(rawW * fit));
  canvas.height = Math.max(1, Math.floor(rawH * fit));
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;
  // pdf.js paints vectors — disable smoothing so glyphs stay crisp
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const drawViewport = page.getViewport({ scale: scale * fit });
  await page.render({
    canvasContext: ctx,
    viewport: drawViewport,
    intent: "display",
  }).promise;

  if (purpose === "thumb") {
    return canvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/jpeg", 0.95);
}

/** Sync lookup — used for instant page switches without awaiting render. */
export function getCachedPdfPagePreview(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 1.5,
  purpose: PreviewPurpose = "canvas",
): string | null {
  const fp = fingerprint(bytes);
  if (fp !== bytesFingerprint && fp !== sharedFp) return null;
  return pageCache.get(cacheKey(pageIndex, scale, purpose)) ?? null;
}

/** Rasterize one PDF page for canvas underlay or rail thumbnail. */
export async function renderPdfPagePreview(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 1.5,
  purpose: PreviewPurpose = "canvas",
): Promise<string | null> {
  const fp = fingerprint(bytes);
  if (fp !== bytesFingerprint && fp !== sharedFp) {
    if (sharedFp && sharedFp !== fp) invalidatePdfPreviewCache();
  }

  const key = cacheKey(pageIndex, scale, purpose);
  const cached = pageCache.get(key);
  if (cached) return cached;

  try {
    const pdf = await ensureSharedPdf(bytes);
    const url = await renderPageToDataUrl(pdf, pageIndex, scale, purpose);
    if (url) pageCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}

/** Warm the cache for nearby pages so next/prev feels instant. */
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

/**
 * Progressively render many thumbnail pages, reusing one pdf.js document.
 * Always PNG at thumb purpose — never JPEG (JPEG mushifies small type).
 */
export async function renderPdfThumbsProgressive(
  bytes: Uint8Array,
  pageIndices: number[],
  scale: number,
  onPage: (pageIndex: number, dataUrl: string | null) => void,
  options?: { chunkSize?: number; signal?: { cancelled: boolean } },
): Promise<void> {
  const chunkSize = options?.chunkSize ?? 3;
  const signal = options?.signal;
  let pdf: PDFDocumentProxy;
  try {
    pdf = await ensureSharedPdf(bytes);
  } catch {
    for (const i of pageIndices) onPage(i, null);
    return;
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
          const url = await renderPageToDataUrl(pdf, pageIndex, scale, "thumb");
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
