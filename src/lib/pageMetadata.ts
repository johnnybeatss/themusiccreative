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
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
