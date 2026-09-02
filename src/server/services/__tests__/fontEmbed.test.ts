import { isGoogleFontFamily } from "../fontEmbed.js";

describe("isGoogleFontFamily", () => {
  describe("positive", () => {
    it("recognizes bundled Google font ids", () => {
      expect(isGoogleFontFamily("Inter")).toBe(true);
      expect(isGoogleFontFamily("Playfair")).toBe(true);
      expect(isGoogleFontFamily("OpenSans")).toBe(true);
    });
  });

  describe("negative", () => {
    it("rejects standard PDF fonts and custom ids", () => {
      expect(isGoogleFontFamily("Helvetica")).toBe(false);
      expect(isGoogleFontFamily("Times-Roman")).toBe(false);
      expect(isGoogleFontFamily("custom:abc")).toBe(false);
      expect(isGoogleFontFamily("")).toBe(false);
    });
  });
});
