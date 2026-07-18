import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { uploadsRoot } from "../../session.js";
import { base64ToBytes, importPdfFromBytes, resolveUploadPath } from "../pdfImport.js";

describe("resolveUploadPath", () => {
  describe("positive", () => {
    it("resolves paths under the uploads root", () => {
      const resolved = resolveUploadPath("/uploads/sessions/abc/file.png");
      expect(resolved).toBe(path.resolve(uploadsRoot, "sessions/abc/file.png"));
    });
  });

  describe("negative", () => {
    it.each([
      ["relative path", "uploads/file.png"],
      ["path traversal", "/uploads/../etc/passwd"],
      ["empty after prefix", "/uploads/"],
      ["unrelated url", "https://evil.example/x.png"],
    ])("rejects %s", (_label, src) => {
      expect(resolveUploadPath(src)).toBeNull();
    });
  });
});

describe("base64ToBytes", () => {
  describe("positive", () => {
    it("decodes plain and data-URL base64", () => {
      const plain = Buffer.from("hello").toString("base64");
      expect(Buffer.from(base64ToBytes(plain)).toString("utf8")).toBe("hello");

      const dataUrl = `data:application/pdf;base64,${plain}`;
      expect(Buffer.from(base64ToBytes(dataUrl)).toString("utf8")).toBe("hello");
    });
  });

  describe("negative", () => {
    it("decodes empty input to empty bytes", () => {
      expect(base64ToBytes("")).toEqual(new Uint8Array([]));
    });
  });
});

describe("importPdfFromBytes", () => {
  describe("positive", () => {
    it("builds a studio document from valid PDF bytes", async () => {
      const src = await PDFDocument.create();
      src.addPage([595.28, 841.89]);
      const bytes = await src.save();
      const doc = await importPdfFromBytes(bytes, "a4.pdf");
      expect(doc.pageSize).toBe("a4");
      expect(doc.pages).toHaveLength(1);
      expect(doc.importedPdf?.ephemeral).toBe(true);
      expect(doc.name).toBe("a4");
    });
  });

  describe("negative", () => {
    it("throws on invalid PDF bytes", async () => {
      await expect(importPdfFromBytes(new Uint8Array([0, 1, 2]), "bad.pdf")).rejects.toThrow();
    });
  });
});
