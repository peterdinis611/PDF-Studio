import {
  LIBRARY_ITEMS,
  createFromLibrary,
  matchesLibraryQuery,
  searchLibraryItems,
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

    it("matches fuzzy typos via Fuse.js", () => {
      expect(matchesLibraryQuery(item, "txt")).toBe(true);
      expect(matchesLibraryQuery(item, "paragrah")).toBe(true);
    });
  });

  describe("negative", () => {
    it("rejects unrelated queries", () => {
      expect(matchesLibraryQuery(item, "invoice-xyz")).toBe(false);
      expect(matchesLibraryQuery(item, "zzzz")).toBe(false);
    });
  });
});

describe("searchLibraryItems", () => {
  describe("positive", () => {
    it("returns all items for empty query", () => {
      expect(searchLibraryItems(LIBRARY_ITEMS, "").length).toBe(LIBRARY_ITEMS.length);
    });

    it("ranks fuzzy matches and keeps known hits", () => {
      const hits = searchLibraryItems(LIBRARY_ITEMS, "rect");
      expect(hits.some((i) => i.id === "rect" || i.label.toLowerCase().includes("rect"))).toBe(true);
    });
  });

  describe("negative", () => {
    it("returns empty for nonsense against a tiny list", () => {
      const only = LIBRARY_ITEMS.filter((i) => i.id === "text");
      expect(searchLibraryItems(only, "zzzz-not-a-thing")).toEqual([]);
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
