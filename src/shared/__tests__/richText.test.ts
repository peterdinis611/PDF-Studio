import {
  RICH_TEXT_SAMPLE,
  richHtmlToPlainText,
  richHtmlToStyledLines,
  sanitizeRichHtml,
} from "../richText.js";

describe("richHtmlToPlainText", () => {
  it("strips tags and keeps heading/list text", () => {
    const text = richHtmlToPlainText("<h1>Title</h1><p>Hello <strong>world</strong></p><ul><li>One</li></ul>");
    expect(text).toContain("Title");
    expect(text).toContain("Hello world");
    expect(text).toContain("• One");
  });

  it("handles empty input", () => {
    expect(richHtmlToPlainText("")).toBe("");
    expect(richHtmlToPlainText("   ")).toBe("");
  });
});

describe("richHtmlToStyledLines", () => {
  it("scales headings and marks bold with inline runs", () => {
    const lines = richHtmlToStyledLines("<h1>Title</h1><p>Body with <strong>bold</strong></p><h3>Sub</h3>");
    expect(lines[0].text).toBe("Title");
    expect(lines[0].sizeScale).toBeGreaterThan(1.5);
    expect(lines[0].bold).toBe(true);
    expect(lines[0].runs?.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.text.includes("Body") && l.bold)).toBe(true);
    expect(lines.find((l) => l.text === "Sub")?.sizeScale).toBeCloseTo(1.2);
  });

  it("parses the library sample", () => {
    const lines = richHtmlToStyledLines(RICH_TEXT_SAMPLE);
    expect(lines.length).toBeGreaterThan(3);
    expect(lines[0].text.toLowerCase()).toMatch(/document title/);
  });

  it("falls back for plain text", () => {
    const lines = richHtmlToStyledLines("just plain");
    expect(lines[0].text).toBe("just plain");
  });
});

describe("sanitizeRichHtml", () => {
  it("strips scripts and handlers", () => {
    const html = sanitizeRichHtml('<p onclick="alert(1)">ok</p><script>evil()</script>');
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("ok");
  });
});
