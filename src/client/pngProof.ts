import type { ExportSettings, PdfDocument } from "../shared/types.js";
import { PAGE_SIZES } from "../shared/types.js";
import { exportPdfBytes } from "./clientExport.js";
import JSZip from "jszip";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type PageImageFormat = "png" | "jpeg";

export type PageImageExportOptions = {
  /** 0-based page index; default 0. */
  pageIndex?: number;
  format?: PageImageFormat;
  /** 0–1 JPEG quality (ignored for PNG). */
  quality?: number;
  /** pdf.js viewport scale; default 1.5 (~108 dpi for 72pt). */
  scale?: number;
  exportSettings?: Partial<ExportSettings>;
};

async function exportDocToPdfBytes(
  doc: PdfDocument,
  apiFetch: FetchLike,
  exportSettings: object = {},
): Promise<Uint8Array> {
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
      flattenForms: true,
      flattenAnnotations: true,
      pdfaLite: false,
      pdfaMode: "off",
      includeComments: false,
      includeWatermark: true,
      ...exportSettings,
    },
  };
  return exportPdfBytes(payload as never, apiFetch);
}

async function renderPdfPageToBlob(
  pdfBytes: Uint8Array,
  pageIndex: number,
  format: PageImageFormat,
  quality: number,
  scale: number,
): Promise<Blob> {
  const { openPdfJsDocument } = await import("./pdfJsDocument.js");
  const pdf = await openPdfJsDocument(pdfBytes);
  try {
    const pageNum = Math.min(pdf.numPages, Math.max(1, pageIndex + 1));
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const dataUrl = canvas.toDataURL(mime, format === "jpeg" ? quality : undefined);
    const res = await fetch(dataUrl);
    return res.blob();
  } finally {
    await pdf.destroy();
  }
}

/** Render each exported PDF page to PNG via pdf.js and pack into a ZIP. */
export async function exportPngProofZip(
  doc: PdfDocument,
  apiFetch: FetchLike,
  exportSettings: object = {},
): Promise<Blob> {
  const pdfBytes = await exportDocToPdfBytes(doc, apiFetch, exportSettings);
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

/** Export a single page as PNG or JPEG. */
export async function exportPageAsImage(
  doc: PdfDocument,
  apiFetch: FetchLike,
  options: PageImageExportOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const pageIndex = options.pageIndex ?? 0;
  const format = options.format ?? "png";
  const quality = options.quality ?? 0.92;
  const scale = options.scale ?? 2;
  const pdfBytes = await exportDocToPdfBytes(doc, apiFetch, options.exportSettings || {});
  const blob = await renderPdfPageToBlob(pdfBytes, pageIndex, format, quality, scale);
  const base = (doc.name || "page").replace(/[^\w.-]+/g, "_");
  const ext = format === "jpeg" ? "jpg" : "png";
  return { blob, filename: `${base}-p${pageIndex + 1}.${ext}` };
}
