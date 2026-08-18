import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

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

// Individual event pages aren't in ROUTES above because they're dynamic —
// without this, a past workshop's page falls out of the sitemap the
// moment it's off the Events list, even though the page itself is still
// live and indexable. Fails soft to [] so a Supabase hiccup can't break
// the whole sitemap.
async function getDynamicRoutes(): Promise<
  { url: string; lastModified: string }[]
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();

  const { data: events } = await supabase.from("events").select("id, date");

  return (events ?? []).map((e) => ({
    url: `${SITE_URL}/events/${e.id}`,
    lastModified: e.date as string,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
  const dynamicRoutes = await getDynamicRoutes();

  return [...staticRoutes, ...dynamicRoutes];
}
