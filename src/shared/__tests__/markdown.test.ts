import { markdownToHtml, markdownToPlainText, MARKDOWN_SAMPLE } from "../markdown.js";

describe("markdownToHtml", () => {
  describe("positive", () => {
    it("renders headings and emphasis", () => {
      const html = markdownToHtml("# Title\n\nHello **world**");
      expect(html).toContain("<h1");
      expect(html).toContain("<strong>world</strong>");
    });

    it("renders lists, code, and blockquotes", () => {
      const html = markdownToHtml("- a\n- b\n\n`code`\n\n> tip");
      expect(html).toContain("<ul>");
      expect(html).toContain("<code>code</code>");
      expect(html).toContain("<blockquote>");
    });

    it("renders the sample markdown used in the library preset", () => {
      const html = markdownToHtml(MARKDOWN_SAMPLE);
      expect(html).toContain("<h1");
      expect(html).toContain("<strong>Markdown</strong>");
    });

    it("returns empty-safe HTML for blank input", () => {
      expect(markdownToHtml("")).toBe("");
      expect(markdownToHtml("hello")).not.toContain("undefined");
    });
  });

  describe("negative", () => {
    it("escapes raw script tags", () => {
      const html = markdownToHtml('<script>alert(1)</script>\n\n**ok**');
      expect(html.toLowerCase()).not.toContain("<script>");
      expect(html).toContain("<strong>ok</strong>");
    });

    it("does not keep javascript: links executable", () => {
      const html = markdownToHtml('[x](javascript:alert(1))');
      expect(html.toLowerCase()).not.toContain('href="javascript:');
    });
  });
});

describe("markdownToPlainText", () => {
  describe("positive", () => {
    it("flattens lists and emphasis for export", () => {
      const text = markdownToPlainText("## Hello\n\n- one\n- two\n\n**bold**");
      expect(text).toContain("Hello");
      expect(text).toContain("• one");
      expect(text).toContain("bold");
      expect(text).not.toContain("**");
    });

    it("keeps ordered lists and code fences as lines", () => {
      const text = markdownToPlainText("1. alpha\n2. beta\n\n```\nline\n```");
      expect(text).toMatch(/1\.\s*alpha/);
      expect(text).toContain("line");
    });

    it("includes link labels and image alt text", () => {
      const text = markdownToPlainText("[Docs](https://example.com)\n\n![Logo](https://example.com/a.png)");
      expect(text).toContain("Docs");
      expect(text).toContain("Logo");
    });
  });

  describe("negative", () => {
    it("returns empty string for empty markdown", () => {
      expect(markdownToPlainText("")).toBe("");
      expect(markdownToPlainText("   ")).toBe("");
    });
  });
});
