import { listGoogleFonts } from "../googleFonts.js";
import { jest } from "@jest/globals";

describe("listGoogleFonts", () => {
  const prevKey = process.env.GOOGLE_FONTS_API_KEY;

  afterEach(() => {
    if (prevKey === undefined) delete process.env.GOOGLE_FONTS_API_KEY;
    else process.env.GOOGLE_FONTS_API_KEY = prevKey;
  });

  describe("positive", () => {
    it("returns bundled fonts when no API key is set", async () => {
      delete process.env.GOOGLE_FONTS_API_KEY;
      const { items, fromApi } = await listGoogleFonts();
      expect(fromApi).toBe(false);
      expect(items.length).toBeGreaterThan(0);
      expect(items.some((f) => f.id === "Inter")).toBe(true);
      expect(items.every((f) => f.source === "bundled")).toBe(true);
    });

    it("filters by query against bundled catalog", async () => {
      delete process.env.GOOGLE_FONTS_API_KEY;
      const { items } = await listGoogleFonts("playfair");
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((f) => /playfair/i.test(f.label) || /playfair/i.test(f.id))).toBe(true);
    });
  });

  describe("negative", () => {
    it("returns an empty list for unmatched queries", async () => {
      delete process.env.GOOGLE_FONTS_API_KEY;
      const { items } = await listGoogleFonts("zzzz-not-a-real-font-name");
      expect(items).toEqual([]);
    });

    it("falls back to bundled fonts when the API key fetch fails", async () => {
      process.env.GOOGLE_FONTS_API_KEY = "bad-key";
      const originalFetch = globalThis.fetch;
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      globalThis.fetch = (async () =>
        ({
          ok: false,
          status: 403,
          json: async () => ({}),
        })) as unknown as typeof fetch;

      try {
        const { items, fromApi } = await listGoogleFonts();
        expect(fromApi).toBe(false);
        expect(items.some((f) => f.id === "Roboto")).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
        warn.mockRestore();
      }
    });
  });
});
