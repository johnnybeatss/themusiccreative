import type { Metadata } from "next";

const SITE_URL = "https://themusiccreative.org";
const SITE_TITLE = "The Music Creative @ FIU";

// Next.js merges the root layout's `metadata` export into every page's own
// `metadata`, but NOT field-by-field for nested objects like `openGraph`/
// `twitter` — if a page doesn't define its own, the entire object from the
// root layout is inherited as-is. Every static public page here only
// defined `title`/`description`/`alternates`, so sharing any link other
// than the homepage (iMessage, Slack, etc.) showed the generic site-wide
// card and title instead of the actual page. Spread this into each page's
// `metadata` export to fix that — see src/app/team/page.tsx for the
// pattern.
export function pageOpenGraph(
  title: string,
  description: string,
  path: string
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_TITLE,
      type: "website",
      // Defining `openGraph` here replaces the root one wholesale, which
      // also dropped the shared share-card image on every subpage. Point
      // back at the root /opengraph-image explicitly.
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: SITE_TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/opengraph-image`],
    },
  };
}
