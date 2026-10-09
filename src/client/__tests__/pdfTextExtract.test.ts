import {
  mapPdfFontName,
  mergeRunsIntoLines,
  type TextRun,
  textRunsToElements,
} from "../pdfTextExtract.js";

function run(partial: Partial<TextRun> & Pick<TextRun, "text" | "x" | "y">): TextRun {
  return {
    width: 40,
    height: 14,
    fontSize: 12,
    rotation: 0,
    fontFamily: "Helvetica",
    fontWeight: "normal",
    fontStyle: "normal",
    ...partial,
  };
}

describe("mapPdfFontName", () => {
  describe("positive", () => {
    it("maps Times and Courier families with weight/style", () => {
      expect(mapPdfFontName("TimesNewRomanPS-BoldItalicMT")).toEqual({
        fontFamily: "Times-Roman",
        fontWeight: "bold",
        fontStyle: "italic",
      });
      expect(mapPdfFontName("CourierNew")).toEqual({
        fontFamily: "Courier",
        fontWeight: "normal",
        fontStyle: "normal",
      });
    });
  });

  describe("negative", () => {
    it("falls back to Helvetica for unknown or empty names", () => {
      expect(mapPdfFontName(undefined).fontFamily).toBe("Helvetica");
      expect(mapPdfFontName("g_d0_f1").fontFamily).toBe("Helvetica");
    });
  });
});

describe("mergeRunsIntoLines", () => {
  describe("positive", () => {
    it("joins adjacent runs on the same baseline", () => {
      const lines = mergeRunsIntoLines([
        run({ text: "Hello", x: 10, y: 100, width: 30, fontSize: 12 }),
        run({ text: "world", x: 44, y: 101, width: 35, fontSize: 12 }),
      ]);
      expect(lines).toHaveLength(1);
      expect(lines[0].text).toBe("Hello world");
      expect(lines[0].width).toBeGreaterThan(30);
    });

    it("keeps separate lines when Y differs", () => {
      const lines = mergeRunsIntoLines([
        run({ text: "One", x: 10, y: 100, width: 20 }),
        run({ text: "Two", x: 10, y: 130, width: 20 }),
      ]);
      expect(lines.map((l) => l.text)).toEqual(["One", "Two"]);
    });
  });

  describe("negative", () => {
    it("returns empty for empty input and drops blank merges", () => {
      expect(mergeRunsIntoLines([])).toEqual([]);
      expect(mergeRunsIntoLines([run({ text: "   ", x: 0, y: 0 })])).toEqual([]);
    });
  });
});

describe("textRunsToElements", () => {
  describe("positive", () => {
    it("creates TextElements with content and metrics", () => {
      const els = textRunsToElements([
        run({ text: "Title", x: 50, y: 80, fontSize: 24, width: 60, height: 30 }),
      ]);
      expect(els).toHaveLength(1);
      expect(els[0].type).toBe("text");
      expect(els[0].content).toBe("Title");
      expect(els[0].fontSize).toBe(24);
      expect(els[0].x).toBe(50);
      expect(els[0].y).toBe(80);
    });
  });
});
