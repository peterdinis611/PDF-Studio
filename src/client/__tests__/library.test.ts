import {
  LIBRARY_ITEMS,
  createFromLibrary,
  matchesLibraryQuery,
} from "../library.js";

describe("matchesLibraryQuery", () => {
  const item = LIBRARY_ITEMS.find((i) => i.id === "text")!;

  describe("positive", () => {
    it("matches empty query as true", () => {
      expect(matchesLibraryQuery(item, "")).toBe(true);
      expect(matchesLibraryQuery(item, "   ")).toBe(true);
    });

    it("matches label, hint, category, and tags", () => {
      expect(matchesLibraryQuery(item, "text")).toBe(true);
      expect(matchesLibraryQuery(item, "paragraph")).toBe(true);
      expect(matchesLibraryQuery(item, "basics")).toBe(true);
      expect(matchesLibraryQuery(item, "copy")).toBe(true);
    });
  });

  describe("negative", () => {
    it("rejects unrelated queries", () => {
      expect(matchesLibraryQuery(item, "invoice-xyz")).toBe(false);
      expect(matchesLibraryQuery(item, "zzzz")).toBe(false);
    });
  });
});

describe("createFromLibrary", () => {
  describe("positive", () => {
    it("creates concrete elements for basic kinds", () => {
      const text = createFromLibrary("text", 10, 20);
      expect(text).not.toBe("image");
      expect(text).not.toBe("signature");
      if (typeof text !== "string") {
        expect(text.type).toBe("text");
        expect(text.x).toBe(10);
        expect(text.y).toBe(20);
      }
    });

    it("returns image and signature placeholders for upload flows", () => {
      expect(createFromLibrary("image", 0, 0)).toBe("image");
      expect(createFromLibrary("signature", 0, 0)).toBe("signature");
    });
  });

  describe("negative", () => {
    it("does not return a drawable element for image kind", () => {
      const result = createFromLibrary("image", 5, 5);
      expect(result).toBe("image");
      expect(typeof result === "object" && result && "type" in result).toBe(false);
    });
  });
});
