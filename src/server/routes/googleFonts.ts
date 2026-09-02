import { Router } from "express";
import { GOOGLE_FONTS } from "../../shared/types.js";
import { audit, requestContext } from "../audit.js";

export type GoogleFontListItem = {
  id: string;
  label: string;
  googleFamily: string;
  source: "bundled" | "api";
};

type WebfontItem = {
  family: string;
  category?: string;
  variants?: string[];
};

let apiCache: { at: number; items: GoogleFontListItem[] } | null = null;
const API_CACHE_MS = 1000 * 60 * 60 * 12;

function bundledFonts(): GoogleFontListItem[] {
  return GOOGLE_FONTS.map((f) => ({
    id: f.id,
    label: f.label,
    googleFamily: f.googleFamily,
    source: "bundled" as const,
  }));
}

function toId(family: string): string {
  return `google:${family}`;
}

async function fetchWebfontsCatalog(apiKey: string): Promise<GoogleFontListItem[]> {
  const url = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("sort", "popularity");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Web Fonts API ${res.status}`);
  }
  const data = (await res.json()) as { items?: WebfontItem[] };
  const items = (data.items || []).map((item) => ({
    id: toId(item.family),
    label: item.family,
    googleFamily: item.family,
    source: "api" as const,
  }));
  return items;
}

export async function listGoogleFonts(query = ""): Promise<{
  items: GoogleFontListItem[];
  fromApi: boolean;
}> {
  const q = query.trim().toLowerCase();
  const key = process.env.GOOGLE_FONTS_API_KEY?.trim();
  let fromApi = false;
  let items = bundledFonts();

  if (key) {
    try {
      const now = Date.now();
      if (!apiCache || now - apiCache.at > API_CACHE_MS) {
        apiCache = { at: now, items: await fetchWebfontsCatalog(key) };
      }
      items = apiCache.items;
      fromApi = true;
    } catch (err) {
      console.warn("Google Web Fonts API failed, using bundled list:", err);
    }
  }

  if (q) {
    items = items.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.googleFamily.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q),
    );
  }

  return { items: items.slice(0, 80), fromApi };
}

export const googleFontsRouter = Router();

googleFontsRouter.get("/", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const result = await listGoogleFonts(q);
    res.json({
      ...result,
      apiConfigured: Boolean(process.env.GOOGLE_FONTS_API_KEY?.trim()),
    });
  } catch (err) {
    audit("error", "fonts.google.fail", "Google fonts list failed", {
      sessionId: req.sessionId,
      req: requestContext(req, 500),
      meta: { error: err instanceof Error ? err.message : "unknown" },
    });
    res.status(500).json({ error: "Failed to list Google fonts" });
  }
});
