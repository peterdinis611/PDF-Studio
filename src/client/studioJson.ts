import type { DocWatermark, PdfDocument, PdfElement } from "../shared/types.js";
import {
  base64ToBytes,
  bytesToBase64,
  getSessionImportedPdfBytes,
  setSessionImportedPdfBytes,
} from "./pdfImport.js";

/** Envelope for portable .pdfstudio.json downloads. */
export type PortableStudioFile = {
  version: 1;
  doc: PdfDocument;
  importedPdfBase64?: string;
};

export function isSessionUploadUrl(src: string | undefined | null): boolean {
  return Boolean(src && src.startsWith("/uploads/sessions/"));
}

export function isDataUrl(src: string | undefined | null): boolean {
  return Boolean(src && src.startsWith("data:"));
}

function walkElements(elements: PdfElement[], visit: (el: PdfElement) => void): void {
  for (const el of elements) visit(el);
}

function forEachAssetSrc(doc: PdfDocument, visit: (get: () => string | undefined, set: (v: string) => void) => void): void {
  const pages = [...doc.pages, ...(doc.master ? [{ elements: doc.master.header }, { elements: doc.master.footer }] : [])];
  for (const page of pages) {
    walkElements(page.elements || [], (el) => {
      if (el.type === "image" || el.type === "signature") {
        visit(
          () => el.src,
          (v) => {
            el.src = v;
          },
        );
      }
    });
  }
  if (doc.watermark?.type === "image") {
    const wm = doc.watermark as DocWatermark;
    visit(
      () => wm.src,
      (v) => {
        wm.src = v;
      },
    );
  }
  for (const font of doc.customFonts || []) {
    visit(
      () => font.url,
      (v) => {
        font.url = v;
      },
    );
  }
}

export function collectSessionAssetUrls(doc: PdfDocument): string[] {
  const urls = new Set<string>();
  forEachAssetSrc(doc, (get) => {
    const src = get();
    if (isSessionUploadUrl(src)) urls.add(src!);
  });
  return [...urls];
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const mime = blob.type || "application/octet-stream";
  return `data:${mime};base64,${btoa(binary)}`;
}

async function dataUrlToFile(dataUrl: string, name = "asset.png"): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.includes("jpeg") || blob.type.includes("jpg") ? "jpg" : "png";
  return new File([blob], name.replace(/\.[^.]+$/, "") + `.${ext}`, { type: blob.type || "image/png" });
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Clone doc and inline session uploads as data URLs; optionally attach imported PDF bytes. */
export async function buildPortableStudioFile(
  doc: PdfDocument,
  fetchFn: FetchLike,
): Promise<PortableStudioFile> {
  const clone = structuredClone(doc) as PdfDocument;
  const cache = new Map<string, string>();

  for (const url of collectSessionAssetUrls(clone)) {
    try {
      const res = await fetchFn(url);
      if (!res.ok) continue;
      cache.set(url, await blobToDataUrl(await res.blob()));
    } catch {
      /* leave original URL */
    }
  }

  forEachAssetSrc(clone, (get, set) => {
    const src = get();
    if (src && cache.has(src)) set(cache.get(src)!);
  });

  const sessionBytes = getSessionImportedPdfBytes();
  const portable: PortableStudioFile = { version: 1, doc: clone };
  if (sessionBytes && clone.importedPdf) {
    portable.importedPdfBase64 = bytesToBase64(sessionBytes);
  }
  return portable;
}

/** Hydrate a portable (or bare) studio JSON: re-upload data URLs, restore PDF bytes. */
export async function hydratePortableStudioFile(
  raw: unknown,
  deps: {
    apiFetch: FetchLike;
    normalizeDoc: (doc: PdfDocument) => PdfDocument;
  },
): Promise<PdfDocument> {
  let doc: PdfDocument;
  let importedPdfBase64: string | undefined;

  if (raw && typeof raw === "object" && "version" in raw && "doc" in raw) {
    const envelope = raw as PortableStudioFile;
    doc = envelope.doc;
    importedPdfBase64 = envelope.importedPdfBase64;
  } else {
    doc = raw as PdfDocument;
  }

  const clone = structuredClone(doc) as PdfDocument;

  const uploadDataUrl = async (dataUrl: string): Promise<string | null> => {
    try {
      const file = await dataUrlToFile(dataUrl);
      const form = new FormData();
      form.append("image", file);
      const res = await deps.apiFetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) return null;
      const data = (await res.json()) as { url: string };
      return data.url;
    } catch {
      return null;
    }
  };

  const jobs: Promise<void>[] = [];
  forEachAssetSrc(clone, (get, set) => {
    const src = get();
    if (!isDataUrl(src)) return;
    jobs.push(
      (async () => {
        const url = await uploadDataUrl(src!);
        if (url) set(url);
      })(),
    );
  });
  await Promise.all(jobs);

  if (importedPdfBase64) {
    try {
      setSessionImportedPdfBytes(base64ToBytes(importedPdfBase64));
      if (!clone.importedPdf) {
        clone.importedPdf = {
          pageCount: clone.pages.filter((p) => typeof p.sourcePageIndex === "number").length || clone.pages.length,
          ephemeral: true,
        };
      } else {
        clone.importedPdf = { ...clone.importedPdf, ephemeral: true };
      }
    } catch {
      /* ignore */
    }
  }

  return deps.normalizeDoc(clone);
}

export function persistErrorMessage(err: unknown): string {
  if (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" || (err as DOMException).code === 22)
  ) {
    return "Storage full — export JSON or free space, then try again.";
  }
  return "Could not save — changes may be lost if you close this tab.";
}
