/**
 * EmbedPDF (PDFium WASM) — sharp page rasterization for canvas underlays.
 * Direct (main-thread) engine — reliable with our esbuild bundle.
 */
import { createPdfiumEngine } from "@embedpdf/engines/pdfium-direct-engine";
import type { PdfDocumentObject } from "@embedpdf/models";

/** Copied to public/ during `build:client` / `build:assets`. */
export const EMBEDPDF_WASM_URL = "/public/wasm/pdfium.wasm";

type EmbedPdfEngine = Awaited<ReturnType<typeof createPdfiumEngine>>;

let engine: EmbedPdfEngine | null = null;
let enginePromise: Promise<EmbedPdfEngine> | null = null;

let openDoc: PdfDocumentObject | null = null;
let openFp = "";
let openTask: Promise<PdfDocumentObject> | null = null;

export type EmbedPdfStatus = "idle" | "loading" | "ready" | "error";
let status: EmbedPdfStatus = "idle";
let lastError: string | null = null;

function fingerprint(bytes: Uint8Array): string {
  const n = bytes.byteLength;
  if (n === 0) return "0";
  return `${n}:${bytes[0]}:${bytes[Math.floor(n / 2)]}:${bytes[n - 1]}`;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  if (
    bytes.buffer instanceof ArrayBuffer &&
    bytes.byteOffset === 0 &&
    bytes.byteLength === bytes.buffer.byteLength
  ) {
    return bytes.buffer;
  }
  return bytes.slice().buffer;
}

export function getEmbedPdfStatus(): EmbedPdfStatus {
  return status;
}

export function getEmbedPdfLastError(): string | null {
  return lastError;
}

/** True when PDFium is initialized and ready to render. */
export function isEmbedPdfReady(): boolean {
  return status === "ready" && engine !== null;
}

export async function getEmbedPdfEngine(): Promise<EmbedPdfEngine> {
  if (engine) return engine;
  if (!enginePromise) {
    status = "loading";
    lastError = null;
    enginePromise = createPdfiumEngine(EMBEDPDF_WASM_URL, { fontFallback: null })
      .then((eng) => {
        engine = eng;
        status = "ready";
        return eng;
      })
      .catch((err) => {
        enginePromise = null;
        status = "error";
        lastError = err instanceof Error ? err.message : String(err);
        throw err instanceof Error ? err : new Error(String(err));
      });
  }
  return enginePromise;
}

/** Kick off WASM load early so import isn't racing init. */
export function preloadEmbedPdfEngine(): void {
  if (engine || enginePromise) return;
  void getEmbedPdfEngine().catch(() => {
    /* status already set */
  });
}

export async function ensureEmbedPdfDocument(bytes: Uint8Array): Promise<PdfDocumentObject> {
  const fp = fingerprint(bytes);
  if (openDoc && openFp === fp) return openDoc;
  if (openTask && openFp === fp) return openTask;

  const eng = await getEmbedPdfEngine();
  if (openDoc) {
    try {
      await eng.closeDocument(openDoc).toPromise();
    } catch {
      /* ignore */
    }
    openDoc = null;
  }

  openFp = fp;
  openTask = eng
    .openDocumentBuffer({ id: `studio-${fp}`, content: toArrayBuffer(bytes) })
    .toPromise()
    .then((doc) => {
      openDoc = doc;
      openTask = null;
      return doc;
    })
    .catch((err) => {
      openTask = null;
      openFp = "";
      throw err;
    });

  return openTask;
}

export async function closeEmbedPdfDocument(): Promise<void> {
  openTask = null;
  openFp = "";
  if (!openDoc || !engine) {
    openDoc = null;
    return;
  }
  const doc = openDoc;
  openDoc = null;
  try {
    await engine.closeDocument(doc).toPromise();
  } catch {
    /* ignore */
  }
}
