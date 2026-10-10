import { applyMailMerge, parseCsv } from "../mailMerge.js";
import { createText, defaultDoc, uid } from "../factories.js";

describe("parseCsv", () => {
  it("parses headers and quoted fields", () => {
    const { headers, rows } = parseCsv('meno,mesto\n"Peter, Jr.",Bratislava\nAnna,Kosice\n');
    expect(headers).toEqual(["meno", "mesto"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ meno: "Peter, Jr.", mesto: "Bratislava" });
  });

  it("returns empty for blank input", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [] });
  });
});

describe("applyMailMerge", () => {
  it("clones pages per row and keeps page tokens", () => {
    const doc = defaultDoc();
    doc.pages = [
      {
        id: uid(),
        elements: [
          createText(40, 40, { content: "Hello {{meno}} — page {{page}}", width: 400, height: 24 }),
        ],
      },
    ];
    const merged = applyMailMerge(doc, [{ meno: "Ada" }, { meno: "Grace" }]);
    expect(merged.pages).toHaveLength(2);
    expect(merged.pages[0].elements[0]).toMatchObject({
      type: "text",
      content: "Hello Ada — page {{page}}",
    });
    expect(merged.pages[0].mergeFields).toEqual({ meno: "Ada" });
    expect(merged.pages[1].mergeFields).toEqual({ meno: "Grace" });
  });
});
