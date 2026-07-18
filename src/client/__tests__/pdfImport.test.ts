import { PDFDocument } from "pdf-lib";
import {
  bytesToBase64,
  clearSessionImportedPdf,
  getSessionImportedPdfBytes,
  importPdfInBrowser,
  setSessionImportedPdfBytes,
} from "../pdfImport.js";

async function makePdfFile(
  name = "sample.pdf",
  opts: { pages?: number; width?: number; height?: number } = {},
): Promise<File> {
  const doc = await PDFDocument.create();
  const pages = opts.pages ?? 2;
  const width = opts.width ?? 400;
  const height = opts.height ?? 600;
  for (let i = 0; i < pages; i++) doc.addPage([width, height]);
  const bytes = await doc.save();
  return new File([bytes], name, { type: "application/pdf" });
}

describe("session imported PDF bytes", () => {
  afterEach(() => clearSessionImportedPdf());

  describe("positive", () => {
    it("stores bytes in memory for the open session", () => {
      setSessionImportedPdfBytes(new Uint8Array([1, 2, 3]));
      expect(getSessionImportedPdfBytes()).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe("negative", () => {
    it("returns null after clear", () => {
      setSessionImportedPdfBytes(new Uint8Array([9]));
      clearSessionImportedPdf();
      expect(getSessionImportedPdfBytes()).toBeNull();
    });
  });
});

describe("bytesToBase64", () => {
  describe("positive", () => {
    it("encodes bytes to base64", () => {
      expect(bytesToBase64(new Uint8Array([72, 105]))).toBe(btoa("Hi"));
    });
  });

  describe("negative", () => {
    it("encodes empty input to empty base64", () => {
      expect(bytesToBase64(new Uint8Array([]))).toBe("");
    });
  });
});

describe("importPdfInBrowser", () => {
  afterEach(() => clearSessionImportedPdf());

  describe("positive", () => {
    it("builds a studio document and keeps PDF bytes in memory", async () => {
      const file = await makePdfFile("report.pdf");
      const doc = await importPdfInBrowser(file);

      expect(doc.name).toBe("report");
      expect(doc.pages).toHaveLength(2);
      expect(doc.importedPdf?.pageCount).toBe(2);
      expect(doc.importedPdf?.ephemeral).toBe(true);
      expect(doc.pages[0].sourcePageIndex).toBe(0);
      expect(getSessionImportedPdfBytes()?.byteLength).toBeGreaterThan(0);
    });

    it("maps letter-sized pages to letter pageSize", async () => {
      const file = await makePdfFile("us.pdf", { pages: 1, width: 612, height: 792 });
      const doc = await importPdfInBrowser(file);
      expect(doc.pageSize).toBe("letter");
    });

    it("falls back to Imported PDF when filename has no stem", async () => {
      const file = await makePdfFile(".pdf", { pages: 1 });
      const doc = await importPdfInBrowser(file);
      expect(doc.name).toBe("Imported PDF");
    });
  });

  describe("negative", () => {
    it("rejects non-PDF binary data", async () => {
      const file = new File([new Uint8Array([1, 2, 3, 4])], "fake.pdf", {
        type: "application/pdf",
      });
      await expect(importPdfInBrowser(file)).rejects.toThrow();
      expect(getSessionImportedPdfBytes()).toBeNull();
    });

    it("rejects empty files", async () => {
      const file = new File([], "empty.pdf", { type: "application/pdf" });
      await expect(importPdfInBrowser(file)).rejects.toThrow();
      expect(getSessionImportedPdfBytes()).toBeNull();
    });
  });
});
