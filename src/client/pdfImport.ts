import { PDFDocument } from "pdf-lib";
import { PAGE_SIZES, type PageSize, type PdfDocument, type PdfPage } from "../shared/types.js";
import { uid } from "./factories.js";

/** In-memory only — cleared when the tab/window closes. Never written to disk or localStorage. */
let sessionPdfBytes: Uint8Array | null = null;

export function getSessionImportedPdfBytes(): Uint8Array | null {
  return sessionPdfBytes;
}

export function clearSessionImportedPdf(): void {
  sessionPdfBytes = null;
}

export function setSessionImportedPdfBytes(bytes: Uint8Array): void {
  sessionPdfBytes = bytes;
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

/** Parse a PDF file entirely in the browser — nothing is uploaded to the server. */
export async function importPdfInBrowser(file: File): Promise<PdfDocument> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  if (!pageCount) throw new Error("PDF has no pages");

  const first = src.getPage(0);
  const { width, height } = first.getSize();
  const pageSize = closestPageSize(width, height);

  const pages: PdfPage[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = src.getPage(i);
    const size = page.getSize();
    pages.push({
      id: uid(),
      elements: [
        {
          id: uid(),
          type: "text",
          x: 40,
          y: 40,
          width: Math.min(400, size.width - 80),
          height: 48,
          rotation: 0,
          opacity: 0.55,
          locked: true,
          content: `Imported PDF · page ${i + 1} of ${pageCount}\nAdd overlays above this page (kept in memory only)`,
          fontSize: 12,
          fontFamily: "Helvetica",
          fontWeight: "normal",
          fontStyle: "normal",
          underline: false,
          lineHeight: 1.3,
          letterSpacing: 0,
          listStyle: "none",
          color: "#64748b",
          align: "left",
        },
      ],
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
