import {
  LIBRARY_ITEMS,
  createFromLibrary,
  matchesLibraryQuery,
  searchLibraryItems,
} from "../library.js";
import type { TextElement, FormTextElement, IconElement } from "../../shared/types.js";

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

    it("finds markdown and lorem presets by tag", () => {
      const md = LIBRARY_ITEMS.find((i) => i.id === "markdown")!;
      const lorem = LIBRARY_ITEMS.find((i) => i.id === "lorem")!;
      expect(matchesLibraryQuery(md, "tanstack")).toBe(true);
      expect(matchesLibraryQuery(lorem, "dummy")).toBe(true);
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

    it("finds fillable form items", () => {
      const hits = searchLibraryItems(LIBRARY_ITEMS, "fillable");
      expect(hits.some((i) => i.id.startsWith("fill-"))).toBe(true);
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

    it("creates a markdown text preset with markdown flag", () => {
      const el = createFromLibrary("preset:markdown", 12, 24);
      expect(typeof el).not.toBe("string");
      if (typeof el === "string") return;
      expect(el.type).toBe("text");
      const text = el as TextElement;
      expect(text.markdown).toBe(true);
      expect(text.content).toMatch(/Markdown/i);
      expect(text.x).toBe(12);
    });

    it("creates fillable form elements", () => {
      const field = createFromLibrary("formText", 0, 0);
      expect(typeof field).not.toBe("string");
      if (typeof field === "string") return;
      expect(field.type).toBe("formText");
      expect((field as FormTextElement).placeholder).toBeTruthy();
    });

    it("creates icon elements from icon: kinds", () => {
      const icon = createFromLibrary("icon:calendar", 5, 5);
      expect(typeof icon).not.toBe("string");
      if (typeof icon === "string") return;
      expect(icon.type).toBe("icon");
      expect((icon as IconElement).icon).toBe("calendar");
    });
  });

  describe("negative", () => {
    it("does not return a drawable element for image kind", () => {
      const result = createFromLibrary("image", 5, 5);
      expect(result).toBe("image");
    });
  });
});

describe("LIBRARY_ITEMS inventory", () => {
  it("has unique ids", () => {
    const ids = LIBRARY_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes recent additions", () => {
    const ids = new Set(LIBRARY_ITEMS.map((i) => i.id));
    for (const id of ["markdown", "lorem", "fill-text", "icon-globe", "stamp-rejected"]) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
