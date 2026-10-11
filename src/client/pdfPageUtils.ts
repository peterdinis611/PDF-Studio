import { PDFDocument, degrees } from "pdf-lib";
import type { PdfDocument, PdfPage } from "../shared/types.js";
import { uid } from "./factories.js";
import {
  getSessionImportedPdfBytes,
  setSessionImportedPdfBytes,
} from "./pdfImport.js";

export type PageRotation = 0 | 90 | 180 | 270;

export function normalizeRotation(value: number): PageRotation {
  const n = ((Math.round(value / 90) * 90) % 360 + 360) % 360;
  return n as PageRotation;
}

export type MergePdfOptions = {
  /** 0-based inclusive range of pages to take from the incoming PDF. */
  fromIndex?: number;
  toIndex?: number;
};

/** Merge another PDF's pages onto the current document (overlay underlays). */
export async function mergePdfFileIntoDoc(
  doc: PdfDocument,
  file: File,
  options: MergePdfOptions = {},
): Promise<PdfDocument> {
  const incoming = new Uint8Array(await file.arrayBuffer());
  const addDoc = await PDFDocument.load(incoming, { ignoreEncryption: true });
  const total = addDoc.getPageCount();
  if (!total) throw new Error("PDF has no pages");

  const from = Math.max(0, options.fromIndex ?? 0);
  const to = Math.min(total - 1, options.toIndex ?? total - 1);
  if (from > to) throw new Error("Invalid page range");
  const indices = Array.from({ length: to - from + 1 }, (_, i) => from + i);

  const existingBytes = getSessionImportedPdfBytes();
  const outPdf = await PDFDocument.create();
  let baseOffset = 0;

  if (existingBytes) {
    const base = await PDFDocument.load(existingBytes, { ignoreEncryption: true });
    const basePages = await outPdf.copyPages(base, base.getPageIndices());
    for (const p of basePages) outPdf.addPage(p);
    baseOffset = base.getPageCount();
  }

  const newPages = await outPdf.copyPages(addDoc, indices);
  for (const p of newPages) outPdf.addPage(p);

  const mergedBytes = await outPdf.save();
  setSessionImportedPdfBytes(mergedBytes);

  const pages: PdfPage[] = [
    ...doc.pages.map((p) => ({ ...structuredClone(p), id: p.id })),
  ];
  for (let i = 0; i < indices.length; i++) {
    pages.push({
      id: uid(),
      elements: [],
      applyMaster: false,
      sourcePageIndex: baseOffset + i,
      rotation: 0,
    });
  }

  return {
    ...doc,
    pages,
    importedPdf: {
      pageCount: baseOffset + indices.length,
      name: doc.importedPdf?.name
        ? `${doc.importedPdf.name} + ${file.name}`
        : file.name,
      ephemeral: true,
      mode: doc.importedPdf?.mode === "editable" ? "overlay" : doc.importedPdf?.mode || "overlay",
    },
    updatedAt: new Date().toISOString(),
  };
}

/** Build a new studio doc from a page index range (inclusive). */
export function extractPagesToDoc(
  doc: PdfDocument,
  fromIndex: number,
  toIndex: number,
): PdfDocument {
  const start = Math.max(0, Math.min(fromIndex, toIndex));
  const end = Math.min(doc.pages.length - 1, Math.max(fromIndex, toIndex));
  const slice = doc.pages.slice(start, end + 1).map((p) => {
    const copy = structuredClone(p) as PdfPage;
    copy.id = uid();
    copy.elements = (copy.elements || []).map((el) => ({ ...el, id: uid() }));
    return copy;
  });
  return {
    ...structuredClone(doc),
    id: uid(),
    name: `${doc.name || "Document"} (pages ${start + 1}–${end + 1})`,
    pages: slice,
    comments: (doc.comments || []).filter((c) => slice.some((p) => p.id === c.pageId)),
    updatedAt: new Date().toISOString(),
  };
}

/** Export selected page indices as a standalone PDF (source pages when available). */
export async function extractPagesToPdfBytes(
  doc: PdfDocument,
  indices: number[],
): Promise<Uint8Array> {
  const session = getSessionImportedPdfBytes();
  const out = await PDFDocument.create();

  if (session && doc.importedPdf?.mode !== "editable") {
    const src = await PDFDocument.load(session, { ignoreEncryption: true });
    const sourceIndices: number[] = [];
    for (const i of indices) {
      const page = doc.pages[i];
      if (page && typeof page.sourcePageIndex === "number") {
        sourceIndices.push(page.sourcePageIndex);
      }
    }
    if (sourceIndices.length) {
      const copied = await out.copyPages(src, sourceIndices);
      for (let i = 0; i < copied.length; i++) {
        const page = copied[i];
        const studioPage = doc.pages[indices[i]];
        if (studioPage?.rotation) {
          page.setRotation(degrees(studioPage.rotation));
        }
        out.addPage(page);
      }
      return out.save();
    }
  }

  // Fallback: blank pages matching count (elements not re-rendered here)
  for (const i of indices) {
    const studioPage = doc.pages[i];
    if (!studioPage) continue;
    const page = out.addPage();
    if (studioPage.rotation) page.setRotation(degrees(studioPage.rotation));
  }
  return out.save();
}

export function rotatePageInDoc(
  doc: PdfDocument,
  pageIndex: number,
  delta: 90 | -90 | 180,
): PdfDocument {
  const page = doc.pages[pageIndex];
  if (!page) return doc;
  const next = normalizeRotation((page.rotation || 0) + delta);
  const pages = doc.pages.map((p, i) => (i === pageIndex ? { ...p, rotation: next } : p));
  return { ...doc, pages, updatedAt: new Date().toISOString() };
}
