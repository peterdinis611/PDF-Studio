import {
  blankPage,
  cloneElement,
  createSignature,
  createText,
  defaultDoc,
  elementLabel,
  escapeHtml,
} from "../factories.js";

describe("defaultDoc", () => {
  describe("positive", () => {
    it("creates an A4 document with one empty page", () => {
      const doc = defaultDoc();
      expect(doc.pageSize).toBe("a4");
      expect(doc.pages).toHaveLength(1);
      expect(doc.pages[0].elements).toEqual([]);
      expect(doc.name).toBe("Untitled document");
    });
  });
});

describe("createText", () => {
  describe("positive", () => {
    it("applies overrides on top of defaults", () => {
      const el = createText(10, 20, {
        content: "Hello",
        fontFamily: "Inter",
        fontWeight: "bold",
      });
      expect(el.type).toBe("text");
      expect(el.x).toBe(10);
      expect(el.y).toBe(20);
      expect(el.content).toBe("Hello");
      expect(el.fontFamily).toBe("Inter");
      expect(el.fontWeight).toBe("bold");
    });
  });

  describe("negative", () => {
    it("does not keep empty content when override is empty string", () => {
      const el = createText(0, 0, { content: "" });
      expect(el.content).toBe("");
      expect(elementLabel(el)).toBe("Text");
    });
  });
});

describe("cloneElement", () => {
  describe("positive", () => {
    it("copies with a new id and offset", () => {
      const original = createText(0, 0, { content: "Clone me", locked: true });
      const copy = cloneElement(original, 10);
      expect(copy.id).not.toBe(original.id);
      expect(copy.x).toBe(10);
      expect(copy.y).toBe(10);
      expect(copy.type === "text" && copy.content).toBe("Clone me");
      expect(copy.locked).toBe(false);
    });
  });

  describe("negative", () => {
    it("does not mutate the original element", () => {
      const original = createText(5, 5, { content: "Stay" });
      const before = structuredClone(original);
      cloneElement(original, 20);
      expect(original).toEqual(before);
    });
  });
});

describe("elementLabel", () => {
  describe("positive", () => {
    it("summarizes text and signature elements", () => {
      expect(elementLabel(createText(0, 0, { content: "Invoice total" }))).toBe("Invoice total");
      expect(
        elementLabel(
          createSignature(0, 0, { src: "/x.png", name: "Sign", width: 100, height: 40 }),
        ),
      ).toBe("Sign");
    });
  });

  describe("negative", () => {
    it("truncates long text labels", () => {
      const long = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      expect(elementLabel(createText(0, 0, { content: long }))).toHaveLength(24);
    });
  });
});

describe("escapeHtml", () => {
  describe("positive", () => {
    it("escapes markup characters", () => {
      expect(escapeHtml(`<b a="1">&`)).toBe("&lt;b a=&quot;1&quot;&gt;&amp;");
    });
  });

  describe("negative", () => {
    it("leaves safe strings unchanged", () => {
      expect(escapeHtml("plain text 123")).toBe("plain text 123");
    });
  });
});

describe("blankPage", () => {
  describe("positive", () => {
    it("returns a page with no elements", () => {
      const page = blankPage();
      expect(page.elements).toEqual([]);
      expect(page.id).toBeTruthy();
    });
  });
});
