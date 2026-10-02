import { PDFDocument } from "pdf-lib";
import { setSessionImportedPdfBytes } from "./pdfImport.js";

/** Re-bind session PDF bytes after a refresh without replacing the studio document. */
export async function reattachPdfSession(
  file: File,
  expectedPageCount: number,
): Promise<{ pageCount: number; name: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  if (!pageCount) throw new Error("PDF has no pages");
  if (pageCount !== expectedPageCount) {
    throw new Error(`PDF has ${pageCount} pages; this document expects ${expectedPageCount}.`);
  }
  setSessionImportedPdfBytes(bytes);
  return { pageCount, name: file.name };
}

/** True when pages still reference a source PDF but session bytes are gone. */
export function docNeedsPdfReattach(pages: { sourcePageIndex?: number }[]): boolean {
  return pages.some((p) => typeof p.sourcePageIndex === "number");
}
