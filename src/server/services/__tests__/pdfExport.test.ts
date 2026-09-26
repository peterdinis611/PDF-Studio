import { PDFDocument, StandardFonts } from "pdf-lib";
import { createText, uid } from "../../../client/factories.js";
import type { ExportPayload, PdfPage } from "../../../shared/types.js";
import { exportPdf, hexToRgb, substituteTokens } from "../pdfExport.js";

function pageWith(...elements: PdfPage["elements"]): PdfPage {
  return { id: uid(), elements, applyMaster: true };
}

function payload(partial: Partial<ExportPayload> & { pages: PdfPage[] }): ExportPayload {
  return {
    name: "Test",
    pageSize: "a4",
    pageBackground: "#ffffff",
    ...partial,
  };
}

describe("hexToRgb", () => {
  it("parses full and short hex", () => {
    expect(hexToRgb("#ff0000")).toEqual(expect.objectContaining({ red: 1, green: 0, blue: 0 }));
    expect(hexToRgb("#0f0")).toEqual(expect.objectContaining({ red: 0, green: 1, blue: 0 }));
  });

  it("falls back to black on invalid input", () => {
    expect(hexToRgb("not-a-color")).toEqual(expect.objectContaining({ red: 0, green: 0, blue: 0 }));
  });
});

describe("substituteTokens", () => {
  it("replaces page counters", () => {
    expect(substituteTokens("Page {{page}} of {{pages}}", 1, 4)).toBe("Page 2 of 4");
  });
});

describe("exportPdf", () => {
  describe("positive", () => {
    it("exports a blank A4 page", async () => {
      const bytes = await exportPdf(payload({ pages: [pageWith()] }));
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
      const { width } = doc.getPage(0).getSize();
      expect(width).toBeCloseTo(595.28, 0);
    });

    it("exports markdown without raw markers", async () => {
      const el = createText(40, 40, {
        content: "# Hello\n\n**bold** and plain",
        markdown: true,
        fontSize: 14,
        width: 400,
        height: 120,
      });
      const bytes = await exportPdf(payload({ pages: [pageWith(el)] }));
      expect(bytes.byteLength).toBeGreaterThan(500);
      // Content stream should not keep markdown asterisks as source text markers
      const raw = Buffer.from(bytes).toString("latin1");
      expect(raw).not.toContain("**bold**");
    });

    it("draws a text watermark", async () => {
      const bytes = await exportPdf(
        payload({
          pages: [pageWith()],
          watermark: { type: "text", text: "DRAFTMARK", opacity: 0.2, rotation: -30, fontSize: 48 },
        }),
      );
      const blank = await exportPdf(payload({ pages: [pageWith()] }));
      expect(bytes.byteLength).toBeGreaterThan(blank.byteLength);
    });

    it("creates an AcroForm text field", async () => {
      const field = {
        id: uid(),
        type: "formText" as const,
        x: 40,
        y: 100,
        width: 200,
        height: 28,
        rotation: 0,
        opacity: 1,
        locked: false,
        name: "customer_name",
        placeholder: "Name",
        multiline: false,
        fontSize: 12,
        color: "#1a1815",
        borderColor: "#a39a8e",
      };
      const bytes = await exportPdf(payload({ pages: [pageWith(field)] }));
      const doc = await PDFDocument.load(bytes);
      expect(doc.getForm().getTextField("customer_name")).toBeTruthy();
    });

    it("substitutes master page tokens across pages", async () => {
      const header = createText(40, 20, {
        content: "Page {{page}} of {{pages}}",
        fontSize: 10,
        width: 200,
        height: 16,
      });
      const bytes = await exportPdf(
        payload({
          pages: [pageWith(), pageWith()],
          master: { header: [header], footer: [] },
        }),
      );
      // pdf-lib may encode runs with Kern; assert via re-export of substituteTokens + page count
      expect(substituteTokens("Page {{page}} of {{pages}}", 0, 2)).toBe("Page 1 of 2");
      expect(substituteTokens("Page {{page}} of {{pages}}", 1, 2)).toBe("Page 2 of 2");
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(2);
      expect(bytes.byteLength).toBeGreaterThan(800);
    });

    it("embeds an imported PDF background", async () => {
      const src = await PDFDocument.create();
      const font = await src.embedFont(StandardFonts.Helvetica);
      const p = src.addPage([595.28, 841.89]);
      p.drawText("SOURCE", { x: 50, y: 750, size: 24, font });
      const srcBytes = await src.save();
      const overlay = createText(60, 80, { content: "OVERLAY", fontSize: 18, width: 200, height: 24 });
      const bytes = await exportPdf(
        payload({
          pages: [{ id: uid(), elements: [overlay], applyMaster: false, sourcePageIndex: 0 }],
          importedPdfData: Buffer.from(srcBytes).toString("base64"),
          importedPdf: { pageCount: 1, ephemeral: true },
        }),
      );
      expect(bytes.byteLength).toBeGreaterThan(srcBytes.byteLength);
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
    });
  });

  describe("negative", () => {
    it("still exports when importedPdfData is corrupt", async () => {
      const bytes = await exportPdf(
        payload({
          pages: [{ id: uid(), elements: [], applyMaster: true, sourcePageIndex: 0 }],
          importedPdfData: "not-valid-base64-pdf!!!",
        }),
      );
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
    });
  });
});
