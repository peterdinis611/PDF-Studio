import { PAGE_SIZES, PAGE_SIZE_OPTIONS, GOOGLE_FONTS } from "../types.js";

describe("PAGE_SIZES", () => {
  describe("positive", () => {
    it("includes common formats with positive dimensions", () => {
      for (const id of ["a4", "letter", "a3", "square"] as const) {
        expect(PAGE_SIZES[id].width).toBeGreaterThan(0);
        expect(PAGE_SIZES[id].height).toBeGreaterThan(0);
        expect(PAGE_SIZES[id].label.length).toBeGreaterThan(0);
      }
    });

    it("keeps PAGE_SIZE_OPTIONS in sync with PAGE_SIZES keys", () => {
      const keys = Object.keys(PAGE_SIZES).sort();
      const optionIds = PAGE_SIZE_OPTIONS.map((o) => o.id).sort();
      expect(optionIds).toEqual(keys);
    });
  });

  describe("negative", () => {
    it("does not expose unknown page size keys", () => {
      expect(PAGE_SIZES).not.toHaveProperty("unknown");
      expect(PAGE_SIZES).not.toHaveProperty("");
    });
  });
});

describe("GOOGLE_FONTS", () => {
  describe("positive", () => {
    it("lists the fonts used by the editor", () => {
      const ids = GOOGLE_FONTS.map((f) => f.id);
      expect(ids).toEqual(
        expect.arrayContaining(["Inter", "Roboto", "OpenSans", "Lora", "Playfair"]),
      );
    });
  });

  describe("negative", () => {
    it("does not list standard PDF core fonts as Google fonts", () => {
      const ids = GOOGLE_FONTS.map((f) => f.id);
      expect(ids).not.toContain("Helvetica");
      expect(ids).not.toContain("Courier");
    });
  });
});
