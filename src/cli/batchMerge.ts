#!/usr/bin/env node
/**
 * Local batch: template (.pdfstudio.json or bare doc JSON) + CSV/JSON → folder of PDFs.
 *
 * Usage:
 *   npx tsx src/cli/batchMerge.ts --template ./tpl.pdfstudio.json --data ./rows.csv --out ./out
 */
import fs from "node:fs/promises";
import path from "node:path";
import { exportPdf } from "../server/services/pdfExport.js";
import {
  applyMailMergePerRow,
  parseCsv,
  parseJsonMerge,
  type MailMergeRow,
} from "../client/mailMerge.js";
import type { ExportPayload, PdfDocument } from "../shared/types.js";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

async function loadRows(file: string): Promise<MailMergeRow[]> {
  const text = await fs.readFile(file, "utf8");
  if (file.endsWith(".json")) return parseJsonMerge(text).rows;
  return parseCsv(text).rows;
}

async function loadTemplate(file: string): Promise<PdfDocument> {
  const raw = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
  if (raw && typeof raw === "object" && "doc" in raw) {
    return (raw as { doc: PdfDocument }).doc;
  }
  return raw as PdfDocument;
}

async function main() {
  const templatePath = arg("--template");
  const dataPath = arg("--data");
  const outDir = arg("--out", "./pdf-studio-out");
  if (!templatePath || !dataPath) {
    console.error(
      "Usage: npx tsx src/cli/batchMerge.ts --template <file> --data <csv|json> [--out <dir>]",
    );
    process.exit(1);
  }

  const doc = await loadTemplate(path.resolve(templatePath));
  const rows = await loadRows(path.resolve(dataPath));
  if (!rows.length) {
    console.error("No data rows");
    process.exit(1);
  }

  const out = path.resolve(outDir!);
  await fs.mkdir(out, { recursive: true });

  const packages = applyMailMergePerRow(doc, rows);
  console.log(`Rendering ${packages.length} PDF(s) → ${out}`);

  for (const { doc: merged, seq } of packages) {
    const payload: ExportPayload = {
      name: merged.name,
      pageSize: merged.pageSize,
      pageBackground: merged.pageBackground,
      pages: merged.pages,
      master: merged.master,
      watermark: merged.watermark,
      comments: [],
      customFonts: merged.customFonts,
      exportSettings: {
        margin: 0,
        imageQuality: 0.9,
        flatten: false,
        pdfaLite: false,
        includeComments: false,
        includeWatermark: true,
      },
    };
    const bytes = await exportPdf(payload);
    const file = path.join(out, `${merged.name || `doc-${seq}`}.pdf`);
    await fs.writeFile(file, bytes);
    console.log("wrote", file);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
