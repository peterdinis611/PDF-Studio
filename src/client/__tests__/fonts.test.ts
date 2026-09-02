import {
  allFontOptions,
  fontCssFamily,
  googleFamilyCssName,
  googleFontsStylesheetUrl,
  STANDARD_FONTS,
} from "../fonts.js";

describe("fontCssFamily", () => {
  describe("positive", () => {
    it("returns CSS stacks for standard fonts", () => {
      expect(fontCssFamily("Helvetica")).toContain("Helvetica");
      expect(fontCssFamily("Times-Roman")).toContain("Times");
      expect(fontCssFamily("Courier")).toContain("Courier");
    });

    it("returns CSS for Google fonts", () => {
      expect(fontCssFamily("Inter")).toContain("Inter");
      expect(fontCssFamily("OpenSans")).toContain("Open Sans");
      expect(fontCssFamily("Playfair")).toContain("Playfair Display");
      expect(fontCssFamily("Montserrat")).toContain("Montserrat");
      expect(fontCssFamily("google:Poppins" as never)).toContain("Poppins");
    });
  });

  describe("negative", () => {
    it("falls back to Helvetica for unknown families", () => {
      expect(fontCssFamily("UnknownFont" as never)).toBe(STANDARD_FONTS[0].css);
    });

    it("falls back for custom: legacy ids", () => {
      expect(fontCssFamily("custom:abc" as never)).toBe(STANDARD_FONTS[0].css);
    });
  });
});

describe("googleFamilyCssName / googleFontsStylesheetUrl", () => {
  describe("positive", () => {
    it("resolves bundled and google: ids", () => {
      expect(googleFamilyCssName("OpenSans")).toBe("Open Sans");
      expect(googleFamilyCssName("google:Poppins")).toBe("Poppins");
    });

    it("builds a Google CSS2 URL", () => {
      const url = googleFontsStylesheetUrl("Open Sans");
      expect(url).toContain("fonts.googleapis.com/css2");
      expect(url).toContain("Open+Sans");
      expect(url).toContain("ital,wght@");
    });
  });

  describe("negative", () => {
    it("returns null for standard PDF fonts", () => {
      expect(googleFamilyCssName("Helvetica")).toBeNull();
      expect(googleFamilyCssName("google:")).toBeNull();
    });
  });
});

describe("allFontOptions", () => {
  describe("positive", () => {
    it("includes standard and Google fonts without duplicates", () => {
      const options = allFontOptions();
      const ids = options.map((o) => o.id);
      expect(ids).toEqual(expect.arrayContaining(["Helvetica", "Inter", "Lora", "Nunito"]));
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("merges extra google fonts without duplicating", () => {
      const options = allFontOptions([
        { id: "google:Poppins", label: "Poppins" },
        { id: "Inter", label: "Inter again" },
      ]);
      expect(options.filter((o) => o.id === "Inter")).toHaveLength(1);
      expect(options.some((o) => o.id === "google:Poppins")).toBe(true);
    });
  });

  describe("negative", () => {
    it("does not include custom upload placeholders by default", () => {
      const ids = allFontOptions().map((o) => o.id);
      expect(ids.some((id) => id.startsWith("custom:"))).toBe(false);
    });
  });
});
