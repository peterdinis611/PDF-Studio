import { buildRobotsTxt, buildSitemapXml, SITEMAP_ENTRIES } from "../sitemap.js";
import { seo } from "../pageMeta.js";

describe("buildSitemapXml", () => {
  it("includes homepage and editor with image extension on home", () => {
    const xml = buildSitemapXml("https://pdf.example", new Date("2026-10-17T12:00:00Z"));
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(xml).toContain("<loc>https://pdf.example/</loc>");
    expect(xml).toContain("<loc>https://pdf.example/editor</loc>");
    expect(xml).toContain("<lastmod>2026-10-17</lastmod>");
    expect(xml).toContain("<image:loc>https://pdf.example/public/og.png</image:loc>");
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).not.toContain("/api/");
  });

  it("escapes ampersands in loc URLs", () => {
    const xml = buildSitemapXml(
      "https://example.com",
      new Date("2026-01-01"),
      [{ path: "/a?b=1&c=2", changefreq: "monthly", priority: 0.5 }],
    );
    expect(xml).toContain("b=1&amp;c=2");
    expect(xml).not.toMatch(/b=1&c=2/);
  });
});

describe("buildRobotsTxt", () => {
  it("allows public routes and points at the sitemap", () => {
    const txt = buildRobotsTxt("https://pdf.example");
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Disallow: /api/");
    expect(txt).toContain("Disallow: /uploads/");
    expect(txt).toContain("Sitemap: https://pdf.example/sitemap.xml");
  });
});

describe("SITEMAP_ENTRIES", () => {
  it("lists only public HTML entry points", () => {
    const paths = SITEMAP_ENTRIES.map((e) => e.path);
    expect(paths).toEqual(["/", "/editor"]);
  });
});

describe("seo", () => {
  it("builds canonical, OG, keywords and JSON-LD graph", () => {
    const ctx = seo("https://pdf.example", {
      title: "PDF Studio",
      description: "Local-first PDF editor",
      path: "/",
      keywords: "PDF editor, invoice",
    });
    expect(ctx.canonical).toBe("https://pdf.example/");
    expect(ctx.ogImage).toBe("https://pdf.example/public/og.png");
    expect(ctx.keywords).toContain("PDF editor");
    expect(ctx.siteUrl).toBe("https://pdf.example");
    const ld = JSON.parse(ctx.jsonLd);
    expect(ld["@graph"].length).toBeGreaterThan(1);
    expect(ld["@graph"].some((n: { "@type": string }) => n["@type"] === "WebSite")).toBe(true);
  });

  it("marks noindex pages", () => {
    const ctx = seo("https://pdf.example", {
      title: "Missing",
      description: "Not found",
      path: "/missing",
      noindex: true,
    });
    expect(ctx.noindex).toBe(true);
    expect(ctx.canonical).toBe("https://pdf.example/missing");
  });
});
