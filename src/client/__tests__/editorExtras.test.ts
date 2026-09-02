import {
  distributeElements,
  insertTableCol,
  insertTableRow,
  deleteTableCol,
  deleteTableRow,
  resizeTable,
  marginGuideLines,
  MARGIN_PRESETS,
  SHORTCUT_GROUPS,
} from "../editorExtras.js";
import type { PdfElement, TableElement } from "../../shared/types.js";

function rect(id: string, x: number, y: number, width = 10, height = 10): PdfElement {
  return {
    id,
    type: "rect",
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 1,
    cornerRadius: 0,
  };
}

function makeTable(): TableElement {
  return {
    id: "t1",
    type: "table",
    x: 0,
    y: 0,
    width: 100,
    height: 80,
    rotation: 0,
    opacity: 1,
    locked: false,
    rows: 2,
    cols: 2,
    cells: ["a", "b", "c", "d"],
    header: true,
    fill: "#fff",
    headerFill: "#000",
    stroke: "#ccc",
    color: "#111",
    fontSize: 10,
  };
}

describe("distributeElements", () => {
  describe("positive", () => {
    it("spaces three boxes evenly horizontally", () => {
      const els = [rect("a", 0, 0), rect("b", 20, 0), rect("c", 90, 0)];
      distributeElements(els, "horizontal");
      expect(els[0].x).toBe(0);
      expect(els[2].x + els[2].width).toBe(100);
      expect(els[1].x).toBeGreaterThan(els[0].x);
      expect(els[1].x).toBeLessThan(els[2].x);
    });

    it("spaces three boxes evenly vertically", () => {
      const els = [rect("a", 0, 0), rect("b", 0, 20), rect("c", 0, 90)];
      distributeElements(els, "vertical");
      expect(els[0].y).toBe(0);
      expect(els[2].y + els[2].height).toBe(100);
      expect(els[1].y).toBeGreaterThan(els[0].y);
    });
  });

  describe("negative", () => {
    it("no-ops with fewer than three elements", () => {
      const els = [rect("a", 0, 0), rect("b", 40, 0)];
      distributeElements(els, "horizontal");
      expect(els[0].x).toBe(0);
      expect(els[1].x).toBe(40);
    });
  });
});

describe("table helpers", () => {
  describe("positive", () => {
    it("inserts rows and cols", () => {
      const t = makeTable();
      insertTableRow(t, 0);
      expect(t.rows).toBe(3);
      expect(t.cells.length).toBe(6);
      insertTableCol(t, 0);
      expect(t.cols).toBe(3);
      expect(t.cells.length).toBe(9);
    });

    it("deletes and resizes while preserving cells", () => {
      const t = makeTable();
      deleteTableRow(t, 1);
      expect(t.rows).toBe(1);
      expect(t.cells).toEqual(["a", "b"]);
      deleteTableCol(t, 0);
      expect(t.cols).toBe(1);
      expect(t.cells).toEqual(["b"]);
      resizeTable(t, 3, 3);
      expect(t.cells.length).toBe(9);
      expect(t.cells[0]).toBe("b");
    });
  });

  describe("negative", () => {
    it("refuses to delete the last row or column", () => {
      const t = makeTable();
      t.rows = 1;
      t.cols = 1;
      t.cells = ["only"];
      deleteTableRow(t, 0);
      deleteTableCol(t, 0);
      expect(t.rows).toBe(1);
      expect(t.cols).toBe(1);
      expect(t.cells).toEqual(["only"]);
    });

    it("clamps resize to valid bounds", () => {
      const t = makeTable();
      resizeTable(t, 0, 99);
      expect(t.rows).toBe(1);
      expect(t.cols).toBe(12);
    });
  });
});

describe("marginGuideLines", () => {
  describe("positive", () => {
    it("creates four named margin guides", () => {
      const guides = marginGuideLines(595, 842, 40);
      expect(guides).toHaveLength(4);
      expect(guides.map((g) => g.name)).toEqual(["Margin L", "Margin R", "Margin T", "Margin B"]);
      expect(guides[0].position).toBe(40);
      expect(guides[1].position).toBe(555);
    });
  });

  describe("negative", () => {
    it("returns no guides when margin is zero", () => {
      expect(marginGuideLines(595, 842, 0)).toEqual([]);
      expect(marginGuideLines(595, 842, -10)).toEqual([]);
    });
  });
});

describe("MARGIN_PRESETS / SHORTCUT_GROUPS", () => {
  it("includes expected margin sizes", () => {
    expect(MARGIN_PRESETS.normal).toBe(40);
    expect(MARGIN_PRESETS.none).toBe(0);
    expect(MARGIN_PRESETS.wide).toBeGreaterThan(MARGIN_PRESETS.narrow);
  });

  it("lists shortcut groups with unique keys", () => {
    expect(SHORTCUT_GROUPS.length).toBeGreaterThan(2);
    const keys = SHORTCUT_GROUPS.flatMap((g) => g.items.map((i) => i.keys));
    expect(keys).toEqual(expect.arrayContaining(["?", "⌘E", "V"]));
  });
});
