import type { PDFDocument } from "pdf-lib";
import type { PdfaMode } from "../../shared/exportSettings.js";

/** Best-effort PDF/A-oriented metadata and save hints (not full veraPDF conformance). */
export function applyPdfaDocumentHints(
  doc: PDFDocument,
  mode: PdfaMode,
  title: string,
): { useObjectStreams: boolean; blockEncryption: boolean } {
  if (mode === "off") {
    return { useObjectStreams: true, blockEncryption: false };
  }

  doc.setTitle(title || "Document");
  doc.setProducer("PDF Studio");
  doc.setCreator("PDF Studio");
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  if (mode === "strict") {
    doc.setSubject("PDF/A-oriented export from PDF Studio");
    doc.setKeywords(["PDF/A", "PDF Studio", "pdfaid:2b"]);
    return { useObjectStreams: false, blockEncryption: true };
  }

  return { useObjectStreams: false, blockEncryption: false };
}
