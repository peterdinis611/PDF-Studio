import { loremIpsum, loremSentence } from "../lorem.js";

describe("loremIpsum", () => {
  describe("positive", () => {
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

    it("short is shorter than medium on average", () => {
      const shorts = Array.from({ length: 8 }, () => loremIpsum("short").length);
      const mediums = Array.from({ length: 8 }, () => loremIpsum("medium").length);
      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      expect(avg(shorts)).toBeLessThan(avg(mediums));
    });
  });

  describe("negative", () => {
    it("does not return empty or whitespace-only strings", () => {
      for (const size of ["short", "medium", "long"] as const) {
        expect(loremIpsum(size).trim().length).toBeGreaterThan(0);
      }
    });
  });
});

describe("loremSentence", () => {
  describe("positive", () => {
    it("starts with a capital and ends with a period", () => {
      const s = loremSentence(8);
      expect(s[0]).toMatch(/[A-Z]/);
      expect(s.endsWith(".")).toBe(true);
    });

    it("honors approximate word count", () => {
      const s = loremSentence(5);
      const words = s.replace(/\.$/, "").split(/\s+/);
      expect(words.length).toBeGreaterThanOrEqual(3);
      expect(words.length).toBeLessThanOrEqual(8);
    });
  });
});
