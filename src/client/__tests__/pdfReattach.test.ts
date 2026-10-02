import { PDFDocument } from "pdf-lib";
import { reattachPdfSession } from "../pdfReattach.js";
import { clearSessionImportedPdf, getSessionImportedPdfBytes } from "../pdfImport.js";

async function makePdfFile(name: string, pages = 2): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595.28, 841.89]);
  const bytes = await doc.save();
  return new File(
    [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
    name,
    { type: "application/pdf" },
  );
}

describe("reattachPdfSession", () => {
  afterEach(() => clearSessionImportedPdf());

  it("stores bytes when page count matches", async () => {
    const file = await makePdfFile("re.pdf", 2);
    const result = await reattachPdfSession(file, 2);
    expect(result.pageCount).toBe(2);
    expect(getSessionImportedPdfBytes()?.byteLength).toBeGreaterThan(0);
  });

  it("rejects mismatched page counts", async () => {
    const file = await makePdfFile("re.pdf", 1);
    await expect(reattachPdfSession(file, 3)).rejects.toThrow(/expects 3/);
    expect(getSessionImportedPdfBytes()).toBeNull();
  });
});
