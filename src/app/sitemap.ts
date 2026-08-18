import type { MetadataRoute } from "next";

const SITE_URL = "https://themusiccreative.org";

// Public routes only — /eboard is auth-gated and shouldn't be indexed.
const ROUTES = [
  "",
  "/events",
  "/opportunities",
  "/calendar",
  "/team",
  "/merch",
  "/join",
  "/join-team",
  "/dj-booking",
  "/feedback",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
}
