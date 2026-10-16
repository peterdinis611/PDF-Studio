import { PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRef } from "pdf-lib";
import type { DocBookmark } from "../../shared/types.js";

/** Write Acrobat-style document outline (bookmarks) into a pdf-lib document. */
export function writePdfBookmarks(doc: PDFDocument, bookmarks: DocBookmark[]): void {
  const items = (bookmarks || [])
    .map((b) => ({
      title: (b.title || "").trim() || `Page ${(b.pageIndex ?? 0) + 1}`,
      pageIndex: Math.max(0, Math.floor(b.pageIndex ?? 0)),
    }))
    .filter((b) => b.pageIndex < doc.getPageCount());
  if (!items.length) return;

  const ctx = doc.context;
  const pages = doc.getPages();
  const outlinesRef = ctx.nextRef();
  const outlineRefs: PDFRef[] = items.map(() => ctx.nextRef());

  for (let i = 0; i < items.length; i++) {
    const page = pages[items[i].pageIndex];
    const dest = ctx.obj([page.ref, "XYZ", null, null, null]);
    const dict = ctx.obj({
      Title: PDFHexString.fromText(items[i].title),
      Parent: outlinesRef,
      Dest: dest,
    }) as PDFDict;
    if (i > 0) dict.set(PDFName.of("Prev"), outlineRefs[i - 1]);
    if (i < items.length - 1) dict.set(PDFName.of("Next"), outlineRefs[i + 1]);
    ctx.assign(outlineRefs[i], dict);
  }

  const outlinesDict = ctx.obj({
    Type: "Outlines",
    Count: PDFNumber.of(items.length),
    First: outlineRefs[0],
    Last: outlineRefs[outlineRefs.length - 1],
  }) as PDFDict;
  ctx.assign(outlinesRef, outlinesDict);

  doc.catalog.set(PDFName.of("Outlines"), outlinesRef);
  doc.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
}
