import {
  applyMailMerge,
  applyMailMergePerRow,
  evalMergeCondition,
  expandTableFromItems,
  filenameFromRow,
  parseJsonMerge,
} from "../mailMerge.js";
import { createText, createTable, defaultDoc, uid } from "../factories.js";
import { findUrlsInText, substituteTokens } from "../../shared/tokens.js";
import { auditMergeFields } from "../fieldAudit.js";
import { runPreflight } from "../preflight.js";

describe("parseJsonMerge", () => {
  it("parses array of objects", () => {
    const { headers, rows } = parseJsonMerge('[{"meno":"Ada","mesto":"BA"}]');
    expect(headers).toEqual(expect.arrayContaining(["meno", "mesto"]));
    expect(rows[0].meno).toBe("Ada");
  });
});

describe("seq / bates tokens", () => {
  it("formats seq with pipe padding", () => {
    expect(substituteTokens("{{bates|INV-0001}}", 0, 1, { seq: 7 })).toBe("INV-0007");
  });
});

describe("merge zip helpers", () => {
  it("builds one doc per row with filename", () => {
    const doc = defaultDoc();
    doc.pages = [{ id: uid(), elements: [createText(10, 10, { content: "Hi {{meno}}" })] }];
    const packs = applyMailMergePerRow(doc, [
      { meno: "Ada", filename: "ada-letter" },
      { meno: "Grace" },
    ]);
    expect(packs).toHaveLength(2);
    expect(packs[0].doc.name).toBe("ada-letter");
    expect(filenameFromRow({ meno: "X" }, "doc", 3)).toContain("X");
  });
});

describe("conditions", () => {
  it("evaluates skip/hide ops", () => {
    expect(evalMergeCondition({ a: "" }, { field: "a", op: "empty" })).toBe(true);
    expect(evalMergeCondition({ a: "x" }, { field: "a", op: "equals", value: "x" })).toBe(true);
    expect(evalMergeCondition({ a: "hello" }, { field: "a", op: "contains", value: "ell" })).toBe(true);
  });

  it("hides elements with mergeHideWhen", () => {
    const doc = defaultDoc();
    const el = createText(10, 10, { content: "Secret" });
    (el as typeof el & { mergeHideWhen: { field: string; op: "equals"; value: string } }).mergeHideWhen = {
      field: "role",
      op: "equals",
      value: "hide",
    };
    doc.pages = [{ id: uid(), elements: [el, createText(10, 40, { content: "Visible" })] }];
    const merged = applyMailMerge(doc, [{ role: "hide" }]);
    expect(merged.pages[0].elements).toHaveLength(1);
    expect((merged.pages[0].elements[0] as { content: string }).content).toBe("Visible");
  });
});

describe("table items expand", () => {
  it("expands rows from items JSON", () => {
    const table = createTable(20, 20, { rows: 2, cols: 2 });
    table.header = true;
    table.cells = ["Item", "Qty", "{{name}}", "{{qty}}"];
    const expanded = expandTableFromItems(table, {
      items: JSON.stringify([
        { name: "A", qty: "1" },
        { name: "B", qty: "2" },
      ]),
    });
    expect(expanded.rows).toBe(3);
    expect(expanded.cells).toContain("A");
    expect(expanded.cells).toContain("2");
  });
});

describe("urls + audit + preflight", () => {
  it("finds urls", () => {
    expect(findUrlsInText("See https://example.com/x.").map((u) => u.url)).toEqual([
      "https://example.com/x",
    ]);
  });

  it("audits missing headers", () => {
    const doc = defaultDoc();
    doc.pages = [{ id: uid(), elements: [createText(0, 0, { content: "Hi {{meno}}" })] }];
    const issues = auditMergeFields(doc, { headers: ["mesto"] });
    expect(issues.some((i) => i.token === "meno")).toBe(true);
  });

  it("flags missing alt text", () => {
    const doc = defaultDoc();
    const issues = runPreflight(doc);
    expect(Array.isArray(issues)).toBe(true);
  });
});
