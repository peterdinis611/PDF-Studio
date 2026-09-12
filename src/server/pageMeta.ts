/** View context shared by the marketing and notice pages. */

export type SeoInput = {
  /** Full `<title>`. */
  title: string;
  /** Meta description and Open Graph description. */
  description: string;
  /** Path on this origin, e.g. `/` — used for the canonical and `og:url`. */
  path: string;
  /** Set for pages that should stay out of the index (404, 500). */
  noindex?: boolean;
};

export type SeoContext = {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  ogImage: string;
  noindex: boolean;
};

/** Rendered from the masthead — see scripts/build-og.mjs. */
const OG_IMAGE = "/public/og.png";

export function seo(origin: string, input: SeoInput): SeoContext {
  return {
    title: input.title,
    description: input.description,
    canonical: `${origin}${input.path}`,
    ogUrl: `${origin}${input.path}`,
    ogImage: `${origin}${OG_IMAGE}`,
    noindex: input.noindex === true,
  };
}

/** Both error pages are newsprint and neither belongs in a search index. */
export const NOTICE_PAGE = { newsprint: true, noindex: true } as const;

export type Edition = { dateline: string; edition: string; issued: string };

/**
 * Masthead furniture. The landing page is set as a daily broadsheet, so the
 * issue number tracks the day of the year and the dateline is today's date.
 */
export function currentEdition(now = new Date()): Edition {
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000);
  return {
    dateline: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(now),
    edition: String(dayOfYear).padStart(3, "0"),
    issued: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(now),
  };
}
