import {
  distributeElements,
  insertTableCol,
  insertTableRow,
  deleteTableCol,
  deleteTableRow,
  resizeTable,
  MARGIN_PRESETS,
} from "../editorExtras.js";
import type { PdfElement, TableElement } from "../../shared/types.js";

describe("editorExtras", () => {
  describe("distributeElements", () => {
    it("spaces three boxes evenly horizontally", () => {
      const els = [
        { id: "a", type: "rect", x: 0, y: 0, width: 10, height: 10, rotation: 0, opacity: 1, locked: false, fill: "#fff", stroke: "#000", strokeWidth: 1, cornerRadius: 0 },
        { id: "b", type: "rect", x: 20, y: 0, width: 10, height: 10, rotation: 0, opacity: 1, locked: false, fill: "#fff", stroke: "#000", strokeWidth: 1, cornerRadius: 0 },
        { id: "c", type: "rect", x: 90, y: 0, width: 10, height: 10, rotation: 0, opacity: 1, locked: false, fill: "#fff", stroke: "#000", strokeWidth: 1, cornerRadius: 0 },
      ] as PdfElement[];
      distributeElements(els, "horizontal");
      expect(els[0].x).toBe(0);
      expect(els[2].x + els[2].width).toBe(100);
      expect(els[1].x).toBeGreaterThan(els[0].x);
      expect(els[1].x).toBeLessThan(els[2].x);
    });
  });

  describe("table helpers", () => {
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

    it("inserts rows and cols", () => {
      const t = makeTable();
      insertTableRow(t, 0);
      expect(t.rows).toBe(3);
      expect(t.cells.length).toBe(6);
      insertTableCol(t, 0);
      expect(t.cols).toBe(3);
      expect(t.cells.length).toBe(9);
    });

    it("deletes and resizes", () => {
      const t = makeTable();
      deleteTableRow(t, 1);
      expect(t.rows).toBe(1);
      deleteTableCol(t, 0);
      expect(t.cols).toBe(1);
      resizeTable(t, 3, 3);
      expect(t.cells.length).toBe(9);
    });
  });

  describe("margin presets", () => {
    it("includes normal 40pt", () => {
      expect(MARGIN_PRESETS.normal).toBe(40);
      expect(MARGIN_PRESETS.none).toBe(0);
    });
  });
});
