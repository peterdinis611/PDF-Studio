import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

/** Served from /public/js — copied during `build:assets`. */
GlobalWorkerOptions.workerSrc = "/public/js/pdf.worker.min.mjs";

const pageCache = new Map<number, string>();
let bytesFingerprint = "";

function fingerprint(bytes: Uint8Array): string {
  const n = bytes.byteLength;
  if (n === 0) return "0";
  return `${n}:${bytes[0]}:${bytes[Math.floor(n / 2)]}:${bytes[n - 1]}`;
}

export function invalidatePdfPreviewCache(): void {
  pageCache.clear();
  bytesFingerprint = "";
}

/** Rasterize one PDF page to a JPEG data URL for the canvas underlay. */
export async function renderPdfPagePreview(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 1.5,
): Promise<string | null> {
  const fp = fingerprint(bytes);
  if (fp !== bytesFingerprint) {
    invalidatePdfPreviewCache();
    bytesFingerprint = fp;
  }

  const cached = pageCache.get(pageIndex);
  if (cached) return cached;

  try {
    const loadingTask = getDocument({ data: bytes.slice() });
    const pdf = await loadingTask.promise;
    if (pageIndex < 0 || pageIndex >= pdf.numPages) {
      await pdf.destroy();
      return null;
    }
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      await pdf.destroy();
      return null;
    }
    await page.render({ canvasContext: ctx, viewport }).promise;
    const url = canvas.toDataURL("image/jpeg", 0.88);
    pageCache.set(pageIndex, url);
    await pdf.destroy();
    return url;
  } catch {
    return null;
  }
}
