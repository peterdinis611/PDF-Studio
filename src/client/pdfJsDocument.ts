import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";

/** Served from /public/js — copied during `build:assets`. */
export function configurePdfJsWorker(): void {
  GlobalWorkerOptions.workerSrc = "/public/js/pdf.worker.min.mjs";
}

configurePdfJsWorker();

/** Open a PDF with pdf.js. Caller must `destroy()` when finished. */
export async function openPdfJsDocument(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const loadingTask = getDocument({ data: bytes.slice() });
  return loadingTask.promise;
}
