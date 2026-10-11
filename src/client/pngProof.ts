import type { PdfDocument } from "../shared/types.js";
import { PAGE_SIZES } from "../shared/types.js";
import { exportPdfBytes } from "./clientExport.js";
import JSZip from "jszip";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Render each exported PDF page to PNG via pdf.js and pack into a ZIP. */
export async function exportPngProofZip(
  doc: PdfDocument,
  apiFetch: FetchLike,
  exportSettings: object = {},
): Promise<Blob> {
  const payload = {
    name: doc.name,
    pageSize: doc.pageSize,
    pageBackground: doc.pageBackground,
    pages: doc.pages,
    master: doc.master,
    watermark: doc.watermark,
    comments: [],
    customFonts: doc.customFonts || [],
    exportSettings: {
      margin: 0,
      imageQuality: 0.92,
      flatten: true,
      pdfaLite: false,
      includeComments: false,
      includeWatermark: true,
      ...exportSettings,
    },
  };

  const pdfBytes = await exportPdfBytes(payload as never, apiFetch);
  const { openPdfJsDocument } = await import("./pdfJsDocument.js");
  const pdf = await openPdfJsDocument(pdfBytes);
  const zip = new JSZip();
  const scale = 1.5;

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/png");
      const b64 = dataUrl.split(",")[1] || "";
      zip.file(`page-${String(i).padStart(3, "0")}.png`, b64, { base64: true });
    }
  } finally {
    await pdf.destroy();
  }

  void PAGE_SIZES;
  return zip.generateAsync({ type: "blob" });
}
