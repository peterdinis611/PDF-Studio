import { loremIpsum, loremSentence } from "../lorem.js";

describe("loremIpsum", () => {
  it("returns non-empty latin-ish text for each size", () => {
    for (const size of ["short", "medium", "long"] as const) {
      const text = loremIpsum(size);
      expect(text.length).toBeGreaterThan(10);
      expect(text).toMatch(/[A-Z]/);
      expect(text.endsWith(".")).toBe(true);
    }
  });

  it("long size includes a paragraph break", () => {
    expect(loremIpsum("long")).toContain("\n\n");
  });
});

describe("loremSentence", () => {
  it("starts with a capital and ends with a period", () => {
    const s = loremSentence(8);
    expect(s[0]).toMatch(/[A-Z]/);
    expect(s.endsWith(".")).toBe(true);
  });
});
