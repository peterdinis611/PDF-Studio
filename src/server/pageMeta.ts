/** View context shared by the marketing and notice pages. */
import { formatDateline, formatEditionNumber, formatIssued } from "../shared/dates.js";

export type SeoInput = {
  /** Full `<title>`. */
  title: string;
  /** Meta description and Open Graph description. */
  description: string;
  /** Path on this origin, e.g. `/` — used for the canonical and `og:url`. */
  path: string;
  /** Set for pages that should stay out of the index (404, 500). */
  noindex?: boolean;
  /** Comma-separated keywords (optional). */
  keywords?: string;
  /** Override default OG image alt text. */
  ogImageAlt?: string;
  /** schema.org @type for JSON-LD (default WebSite on `/`, WebApplication elsewhere). */
  schemaType?: "WebSite" | "WebApplication" | "WebPage";
};

export type SeoContext = {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  ogImage: string;
  ogImageAlt: string;
  noindex: boolean;
  keywords: string;
  siteUrl: string;
  applicationName: string;
  jsonLd: string;
};

/** Rendered from the masthead — see scripts/build-og.mjs. */
const OG_IMAGE = "/public/og.png";

const DEFAULT_KEYWORDS =
  "PDF editor, PDF maker, invoice PDF, CV PDF, proposal template, local-first PDF, browser PDF export, pdf-lib, free PDF designer";

const DEFAULT_OG_ALT = "PDF Studio — local-first PDF editor in your browser";

export function seo(origin: string, input: SeoInput): SeoContext {
  const siteUrl = origin.replace(/\/$/, "");
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const canonical = path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`;
  const description = input.description;
  const keywords = input.keywords?.trim() || DEFAULT_KEYWORDS;
  const ogImageAlt = input.ogImageAlt?.trim() || DEFAULT_OG_ALT;
  const schemaType =
    input.schemaType || (path === "/" ? "WebSite" : "WebApplication");

  const graph: Record<string, unknown>[] = [
    {
      "@type": schemaType,
      "@id": `${canonical}#app`,
      name: "PDF Studio",
      url: canonical,
      description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Local-first PDF editing",
        "Templates for invoices, letters, CVs",
        "Font embedding on export",
        "No account required",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#org`,
      name: "PDF Studio",
      url: siteUrl,
      logo: `${siteUrl}${OG_IMAGE}`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "PDF Studio",
      description,
      publisher: { "@id": `${siteUrl}/#org` },
      inLanguage: "en",
    },
  ];

  if (path === "/") {
    graph.push({
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: input.title,
      description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${siteUrl}${OG_IMAGE}`,
        width: 1200,
        height: 630,
      },
    });
  }

  return {
    title: input.title,
    description,
    canonical,
    ogUrl: canonical,
    ogImage: `${siteUrl}${OG_IMAGE}`,
    ogImageAlt,
    noindex: input.noindex === true,
    keywords,
    siteUrl,
    applicationName: "PDF Studio",
    jsonLd: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    }),
  };
}

/** Shared chrome flags for notice pages (404 / 500). */
export const NOTICE_PAGE = { newsprint: true, noindex: true } as const;

export type NoticeKind = "not-found" | "error";

/**
 * Full view context for 404 / 500 — SEO (noindex) + newsprint masthead furniture.
 */
export function noticeView(
  origin: string,
  kind: NoticeKind,
  options?: { detail?: string | null; path?: string },
): Record<string, unknown> {
  const is404 = kind === "not-found";
  const path = options?.path || (is404 ? "/404" : "/500");
  return {
    ...seo(origin, {
      title: is404 ? "Page not found — PDF Studio" : "Something went wrong — PDF Studio",
      description: is404
        ? "This address isn’t in the PDF Studio edition. Return home or open a blank sheet in the editor."
        : "PDF Studio hit an unexpected error. Try again, or return to the front page.",
      path,
      noindex: true,
      schemaType: "WebPage",
      keywords: "PDF Studio, error, page not found",
    }),
    ...NOTICE_PAGE,
    ...currentEdition(),
    detail: options?.detail ?? null,
  };
}

export type Edition = { dateline: string; edition: string; issued: string };

/**
 * Masthead furniture. The landing page is set as a daily broadsheet, so the
 * issue number tracks the day of the year and the dateline is today's date.
 */
export function currentEdition(now = new Date()): Edition {
  return {
    dateline: formatDateline(now),
    edition: formatEditionNumber(now),
    issued: formatIssued(now),
  };
}
