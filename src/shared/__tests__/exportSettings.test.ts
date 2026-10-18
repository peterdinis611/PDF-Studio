import {
  normalizeExportSettings,
  resolveFlattenAnnotations,
  resolveFlattenForms,
  resolvePdfaMode,
} from "../exportSettings.js";

describe("exportSettings", () => {
  it("migrates legacy flatten and pdfaLite", () => {
    const s = normalizeExportSettings({ flatten: true, pdfaLite: true, margin: 12, imageQuality: 0.8 });
    expect(resolveFlattenForms(s)).toBe(true);
    expect(resolvePdfaMode(s)).toBe("friendly");
    expect(resolveFlattenAnnotations(s)).toBe(true);
  });

  it("honors explicit pdfaMode strict", () => {
    expect(resolvePdfaMode({ margin: 0, imageQuality: 1, pdfaMode: "strict" })).toBe("strict");
  });
});
