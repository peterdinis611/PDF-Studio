import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAGE_SIZES, type PageSize, type PdfDocument, type PdfPage } from "../../shared/types.js";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
const uploadsRoot = path.resolve(root, "uploads");

function closestPageSize(width: number, height: number): PageSize {
  let best: PageSize = "a4";
  let bestScore = Infinity;
  for (const [key, size] of Object.entries(PAGE_SIZES) as [
    PageSize,
    (typeof PAGE_SIZES)[PageSize],
  ][]) {
    const score = Math.abs(size.width - width) + Math.abs(size.height - height);
    if (score < bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

export async function importPdfFromPath(
  filePath: string,
  publicUrl: string,
  originalName: string,
): Promise<PdfDocument> {
  const bytes = await fs.readFile(filePath);
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  const first = src.getPage(0);
  const { width, height } = first.getSize();
  const pageSize = closestPageSize(width, height);

  const pages: PdfPage[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = src.getPage(i);
    const size = page.getSize();
    pages.push({
      id: randomUUID(),
      elements: [
        {
          id: randomUUID(),
          type: "text",
          x: 40,
          y: 40,
          width: Math.min(400, size.width - 80),
          height: 48,
          rotation: 0,
          opacity: 0.55,
          locked: true,
          content: `Imported PDF page ${i + 1} of ${pageCount}\nAdd overlays above this background`,
          fontSize: 12,
          fontFamily: "Helvetica",
          fontWeight: "normal",
          fontStyle: "normal",
          underline: false,
          lineHeight: 1.3,
          letterSpacing: 0,
          listStyle: "none",
          color: "#64748b",
          align: "left",
        },
      ],
      applyMaster: false,
      sourcePageIndex: i,
    });
  }

  const name = originalName.replace(/\.pdf$/i, "") || "Imported PDF";

  return {
    id: randomUUID(),
    name,
    pageSize,
    pageBackground: "#ffffff",
    showGrid: false,
    pages,
    updatedAt: new Date().toISOString(),
    guides: [],
    comments: [],
    importedPdf: { url: publicUrl, pageCount },
  };
}

export function resolveUploadPath(src: string): string | null {
  if (!src.startsWith("/uploads/")) return null;
  const relative = src.replace(/^\/uploads\//, "");
  if (!relative || relative.includes("..")) return null;
  const resolved = path.resolve(uploadsRoot, relative);
  if (!resolved.startsWith(uploadsRoot + path.sep) && resolved !== uploadsRoot) return null;
  return resolved;
}
