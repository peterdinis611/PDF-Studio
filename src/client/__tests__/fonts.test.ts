import { allFontOptions, fontCssFamily, STANDARD_FONTS } from "../fonts.js";

describe("fontCssFamily", () => {
  describe("positive", () => {
    it("returns CSS stacks for standard fonts", () => {
      expect(fontCssFamily("Helvetica")).toContain("Helvetica");
      expect(fontCssFamily("Times-Roman")).toContain("Times");
      expect(fontCssFamily("Courier")).toContain("Courier");
    });

    it("returns CSS for Google fonts", () => {
      expect(fontCssFamily("Inter")).toContain("Inter");
      expect(fontCssFamily("OpenSans")).toContain("Open Sans");
      expect(fontCssFamily("Playfair")).toContain("Playfair Display");
    });
  });

  describe("negative", () => {
    it("falls back to Helvetica for unknown families", () => {
      expect(fontCssFamily("UnknownFont" as never)).toBe(STANDARD_FONTS[0].css);
    });

    it("falls back for custom: legacy ids", () => {
      expect(fontCssFamily("custom:abc" as never)).toBe(STANDARD_FONTS[0].css);
    });
  });
});

describe("allFontOptions", () => {
  describe("positive", () => {
    it("includes standard and Google fonts without duplicates", () => {
      const options = allFontOptions();
      const ids = options.map((o) => o.id);
      expect(ids).toEqual(expect.arrayContaining(["Helvetica", "Inter", "Lora"]));
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("negative", () => {
    it("does not include custom upload placeholders", () => {
      const ids = allFontOptions().map((o) => o.id);
      expect(ids.some((id) => id.startsWith("custom:"))).toBe(false);
    });
  });
});
