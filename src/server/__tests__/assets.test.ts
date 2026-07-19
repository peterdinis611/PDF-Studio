import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  FALLBACK_ASSETS,
  getAssetUrls,
  publicCacheControl,
  resetAssetCache,
} from "../assets.js";

describe("publicCacheControl", () => {
  describe("positive", () => {
    it("marks content-hashed assets as immutable for one year", () => {
      expect(publicCacheControl("/app/public/js/app.a1b2c3d4.js")).toBe(
        "public, max-age=31536000, immutable",
      );
      expect(publicCacheControl("/app/public/css/app.deadbeef.css")).toBe(
        "public, max-age=31536000, immutable",
      );
    });
  });

  describe("negative", () => {
    it("uses a shorter cache for non-hashed public files", () => {
      expect(publicCacheControl("/app/public/js/app.js")).toBe("public, max-age=604800");
      expect(publicCacheControl("/app/public/favicon.ico")).toBe("public, max-age=604800");
    });
  });
});

describe("getAssetUrls", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-studio-assets-"));

  afterEach(() => {
    resetAssetCache();
    fs.rmSync(path.join(tmp, "public"), { recursive: true, force: true });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  describe("positive", () => {
    it("reads hashed URLs from the production manifest", () => {
      fs.mkdirSync(path.join(tmp, "public"), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, "public", "asset-manifest.json"),
        JSON.stringify({
          css: "/public/css/app.aaaaaaaa.css",
          js: "/public/js/app.bbbbbbbb.js",
        }),
      );

      expect(getAssetUrls(tmp, true)).toEqual({
        css: "/public/css/app.aaaaaaaa.css",
        js: "/public/js/app.bbbbbbbb.js",
      });
    });
  });

  describe("negative", () => {
    it("falls back in development and when the manifest is missing", () => {
      expect(getAssetUrls(tmp, false)).toEqual(FALLBACK_ASSETS);
      expect(getAssetUrls(tmp, true)).toEqual(FALLBACK_ASSETS);
    });
  });
});
