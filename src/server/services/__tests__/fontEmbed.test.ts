import {
  isGoogleFontFamily,
  pickFontUrlFromCss,
  resolveGoogleFamilyName,
} from "../fontEmbed.js";

describe("isGoogleFontFamily", () => {
  describe("positive", () => {
    it("recognizes bundled Google font ids", () => {
      expect(isGoogleFontFamily("Inter")).toBe(true);
      expect(isGoogleFontFamily("Playfair")).toBe(true);
      expect(isGoogleFontFamily("OpenSans")).toBe(true);
      expect(isGoogleFontFamily("Montserrat")).toBe(true);
    });

    it("recognizes google: prefixed families", () => {
      expect(isGoogleFontFamily("google:Poppins")).toBe(true);
    });
  });

  describe("negative", () => {
    it("rejects standard PDF fonts and custom ids", () => {
      expect(isGoogleFontFamily("Helvetica")).toBe(false);
      expect(isGoogleFontFamily("Times-Roman")).toBe(false);
      expect(isGoogleFontFamily("custom:abc")).toBe(false);
      expect(isGoogleFontFamily("")).toBe(false);
      expect(isGoogleFontFamily("google:")).toBe(false);
    });
  });
});

describe("resolveGoogleFamilyName", () => {
  it("maps app ids to Google family names", () => {
    expect(resolveGoogleFamilyName("OpenSans")).toBe("Open Sans");
    expect(resolveGoogleFamilyName("Playfair")).toBe("Playfair Display");
    expect(resolveGoogleFamilyName("google:Poppins")).toBe("Poppins");
  });
});

describe("pickFontUrlFromCss", () => {
  const sample = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/inter/v18/normal400.ttf) format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 700;
  src: url(https://fonts.gstatic.com/s/inter/v18/italic700.ttf) format('truetype');
}
`;

  it("picks matching weight and style", () => {
    expect(pickFontUrlFromCss(sample, false, false)).toContain("normal400");
    expect(pickFontUrlFromCss(sample, true, true)).toContain("italic700");
  });

  it("returns null when css has no gstatic urls", () => {
    expect(pickFontUrlFromCss("body { color: red }", false, false)).toBeNull();
  });
});
