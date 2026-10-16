import { PDFDocument } from "pdf-lib";
import {
  PAGE_SIZES,
  type PageSize,
  type PdfDocument,
  type PdfImportMode,
  type PdfPage,
} from "../shared/types.js";
import { uid } from "./factories.js";
import { openPdfJsDocument } from "./pdfJsDocument.js";
import { extractEditablePages } from "./pdfTextExtract.js";
import {
  idbDeleteImportedPdf,
  idbGetImportedPdf,
  idbPutImportedPdf,
  lsClearImportedPdf,
  lsGetImportedPdf,
  lsPutImportedPdf,
} from "./pdfSessionStore.js";

/** In-memory cache; backed by session-scoped localStorage + IndexedDB (survives refresh). */
let sessionPdfBytes: Uint8Array | null = null;

export function getSessionImportedPdfBytes(): Uint8Array | null {
  return sessionPdfBytes;
}

/** Clear in-memory bytes only (does not wipe persisted backup). */
export function clearSessionImportedPdf(): void {
  sessionPdfBytes = null;
}

export function setSessionImportedPdfBytes(bytes: Uint8Array): void {
  sessionPdfBytes = bytes;
}

/** Save current session PDF bytes under a studio document id (LS + IDB). */
export async function persistSessionImportedPdf(docId: string): Promise<void> {
  if (!sessionPdfBytes || !docId) return;
  // localStorage first — same-tab refresh uses session-scoped keys (most reliable)
  try {
    lsPutImportedPdf(docId, sessionPdfBytes, bytesToBase64);
  } catch {
    /* quota */
  }
  try {
    await idbPutImportedPdf(docId, sessionPdfBytes);
  } catch {
    /* private mode / quota */
  }
}

/** Restore PDF bytes after refresh into memory (localStorage, then IndexedDB). */
export async function restoreSessionImportedPdf(docId: string): Promise<boolean> {
  if (!docId) return false;
  if (sessionPdfBytes?.byteLength) return true;

  try {
    const fromLs = lsGetImportedPdf(docId, base64ToBytes);
    if (fromLs?.byteLength) {
      sessionPdfBytes = fromLs;
      return true;
    }
  } catch {
    /* ignore */
  }

  try {
    const bytes = await idbGetImportedPdf(docId);
    if (!bytes?.byteLength) return false;
    sessionPdfBytes = bytes;
    // Warm LS for the next refresh
    try {
      lsPutImportedPdf(docId, bytes, bytesToBase64);
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

/** Drop persisted PDF for a document (new blank doc / failed import). */
export async function clearPersistedImportedPdf(docId?: string): Promise<void> {
  lsClearImportedPdf();
  if (!docId) return;
  try {
    await idbDeleteImportedPdf(docId);
  } catch {
    /* ignore */
  }
}

function closestPageSize(width: number, height: number): PageSize {
  let best: PageSize = "a4";
  let bestScore = Infinity;
  for (const [key, size] of Object.entries(PAGE_SIZES) as [
    PageSize,
    (typeof PAGE_SIZES)[PageSize],
  ][]) {
    const score = Math.abs(size.width - width) + Math.abs(size.height - height);
    if (score < bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

export type ImportPdfOptions = {
  mode?: PdfImportMode;
  /** Experimental OCR for scanned pages in editable mode. */
  ocr?: boolean;
};

/** Parse a PDF file entirely in the browser — nothing is uploaded to the server. */
export async function importPdfInBrowser(
  file: File,
  options: ImportPdfOptions = {},
): Promise<PdfDocument> {
  const mode: PdfImportMode = options.mode ?? "overlay";
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  if (!pageCount) throw new Error("PDF has no pages");

  const first = src.getPage(0);
  const { width, height } = first.getSize();
  const pageSize = closestPageSize(width, height);
  const studio = PAGE_SIZES[pageSize];

  let editableElements: Awaited<ReturnType<typeof extractEditablePages>> | null = null;
  if (mode === "editable") {
    const pdfjs = await openPdfJsDocument(bytes);
    try {
      editableElements = await extractEditablePages(
        pdfjs,
        pageCount,
        {
          studioWidth: studio.width,
          studioHeight: studio.height,
        },
        { ocr: Boolean(options.ocr) },
      );
    } finally {
      await pdfjs.destroy();
    }
  }

  const pages: PdfPage[] = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push({
      id: uid(),
      elements: editableElements?.[i] ?? [],
      applyMaster: false,
      sourcePageIndex: i,
    });
  }

  sessionPdfBytes = bytes;

  const name = file.name.replace(/\.pdf$/i, "") || "Imported PDF";
  return {
    id: uid(),
    name,
    pageSize,
    pageBackground: "#ffffff",
    showGrid: false,
    pages,
    updatedAt: new Date().toISOString(),
    guides: [],
    comments: [],
    importedPdf: {
      pageCount,
      name: file.name,
      ephemeral: true,
      mode,
    },
  };
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Decode plain or data-URL base64 (browser-safe, no Node Buffer). */
export function base64ToBytes(data: string): Uint8Array {
  const cleaned = data.includes(",") ? data.split(",").pop()! : data;
  const binary = atob(cleaned);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
