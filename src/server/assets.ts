import fs from "node:fs";
import path from "node:path";

export type AssetUrls = { css: string; js: string };

export const FALLBACK_ASSETS: AssetUrls = {
  css: "/public/css/app.css",
  js: "/public/js/app.js",
};

/** Matches content-hashed build outputs like `app.a1b2c3d4.js`. */
export const HASHED_ASSET_RE = /\.[a-f0-9]{8}\.(js|css)$/i;

let cached: AssetUrls | null = null;

export function resetAssetCache(): void {
  cached = null;
}

export function getAssetUrls(root: string, isProd: boolean): AssetUrls {
  if (!isProd) return FALLBACK_ASSETS;
  if (cached) return cached;

  const manifestPath = path.join(root, "public", "asset-manifest.json");
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Partial<AssetUrls>;
    cached = {
      css: typeof raw.css === "string" ? raw.css : FALLBACK_ASSETS.css,
      js: typeof raw.js === "string" ? raw.js : FALLBACK_ASSETS.js,
    };
    return cached;
  } catch {
    return FALLBACK_ASSETS;
  }
}

export function publicCacheControl(filePath: string): string {
  if (HASHED_ASSET_RE.test(filePath)) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=604800";
}
