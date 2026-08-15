import type { MetadataRoute } from "next";

const SITE_URL = "https://themusiccreative.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/eboard",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
