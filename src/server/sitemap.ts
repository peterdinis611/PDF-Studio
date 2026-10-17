export type SitemapEntry = {
  path: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  /** Absolute image URL for image sitemap extension (optional). */
  image?: { loc: string; title?: string; caption?: string };
};

/** Public, indexable HTML routes. Keep in sync with robots Allow. */
export const SITEMAP_ENTRIES: Omit<SitemapEntry, "image">[] = [
  { path: "/", changefreq: "weekly", priority: 1 },
  { path: "/editor", changefreq: "monthly", priority: 0.85 },
];

export function buildSitemapXml(
  origin: string,
  now = new Date(),
  entries: Omit<SitemapEntry, "image">[] = SITEMAP_ENTRIES,
): string {
  const site = origin.replace(/\/$/, "");
  const lastmod = now.toISOString().slice(0, 10);
  const ogImage = `${site}/public/og.png`;

  const resolved: SitemapEntry[] = entries.map((e) => {
    if (e.path === "/") {
      return {
        ...e,
        image: {
          loc: ogImage,
          title: "PDF Studio",
          caption: "Local-first PDF editor in your browser",
        },
      };
    }
    return e;
  });

  const urls = resolved
    .map((entry) => {
      const loc =
        entry.path === "/"
          ? `${site}/`
          : `${site}${entry.path.startsWith("/") ? entry.path : `/${entry.path}`}`;
      const imageXml = entry.image
        ? `
    <image:image>
      <image:loc>${escapeXml(entry.image.loc)}</image:loc>
      ${entry.image.title ? `<image:title>${escapeXml(entry.image.title)}</image:title>` : ""}
      ${entry.image.caption ? `<image:caption>${escapeXml(entry.image.caption)}</image:caption>` : ""}
    </image:image>`
        : "";
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>${imageXml}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}

export function buildRobotsTxt(origin: string): string {
  const site = origin.replace(/\/$/, "");
  return [
    "User-agent: *",
    "Allow: /",
    "Allow: /editor",
    "Allow: /public/",
    "Disallow: /api/",
    "Disallow: /uploads/",
    "Disallow: /audit-logs",
    "Disallow: /health",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /uploads/",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "Disallow: /api/",
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
