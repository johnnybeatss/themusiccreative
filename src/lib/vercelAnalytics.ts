import "server-only";

// Server-only client for Vercel's public Web Analytics API
// (https://vercel.com/docs/analytics/web-analytics-api), which reads the
// same aggregated page-view/visitor data already being collected by the
// @vercel/analytics script installed in src/app/layout.tsx. Used by
// src/app/eboard/(protected)/analytics/page.tsx.
//
// Requires three env vars (see .env.example):
//   VERCEL_API_TOKEN        - Vercel access token, vercel.com/account/tokens
//   VERCEL_PROJECT_ID       - Project Settings > General > Project ID
//   VERCEL_TEAM_ID_OR_SLUG  - only if the project lives under a Vercel Team;
//                             leave unset for a personal-account project
//
// Not yet live-verified against a real Vercel account/token as of writing
// this (no way to reach api.vercel.com from this sandbox) — implemented
// directly from Vercel's own current docs, but flagging this so it gets a
// real end-to-end check once the env vars are set.

const VERCEL_API_BASE = "https://api.vercel.com/v1/query/web-analytics";

export type AnalyticsConfigStatus =
  | { configured: true }
  | { configured: false; missing: string[] };

export function getAnalyticsConfigStatus(): AnalyticsConfigStatus {
  const missing: string[] = [];
  if (!process.env.VERCEL_API_TOKEN) missing.push("VERCEL_API_TOKEN");
  if (!process.env.VERCEL_PROJECT_ID) missing.push("VERCEL_PROJECT_ID");
  return missing.length > 0 ? { configured: false, missing } : { configured: true };
}

type VisitsCount = { pageviews: number; visitors: number };
type VisitsAggregateRow = {
  timestamp?: string;
  route?: string;
  referrerHostname?: string;
  deviceType?: string;
  pageviews: number;
  visitors: number;
};

type AnalyticsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function buildParams(extra: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams(extra);
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (projectId) params.set("projectId", projectId);

  const teamIdOrSlug = process.env.VERCEL_TEAM_ID_OR_SLUG;
  if (teamIdOrSlug) {
    // Vercel accepts either teamId (starts with "team_") or a plain team
    // slug for the same purpose — support both so setup doesn't require
    // hunting for the exact ID format (docs: "If you prefer a team slug,
    // replace teamId=... with slug=...").
    params.set(teamIdOrSlug.startsWith("team_") ? "teamId" : "slug", teamIdOrSlug);
  }
  return params;
}

async function queryVercel<T>(path: string, extraParams: Record<string, string>): Promise<AnalyticsResult<T>> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return { ok: false, error: "VERCEL_API_TOKEN is not set." };

  const params = buildParams(extraParams);
  let res: Response;
  try {
    res = await fetch(`${VERCEL_API_BASE}/${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      // Analytics don't need to be second-by-second fresh — cache 5 min so
      // repeated dashboard loads don't hit Vercel's API every time.
      next: { revalidate: 300 },
    });
  } catch {
    return { ok: false, error: "Could not reach Vercel's API." };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Vercel API returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
    };
  }

  const json = await res.json().catch(() => null);
  if (!json || typeof json !== "object" || !("data" in json)) {
    return { ok: false, error: "Unexpected response shape from Vercel's API." };
  }
  return { ok: true, data: json.data as T };
}

function dateRange(days: number) {
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { since: fmt(since), until: fmt(until) };
}

export type SiteAnalytics = {
  totals: VisitsCount;
  daily: VisitsAggregateRow[];
  topPages: VisitsAggregateRow[];
  topReferrers: VisitsAggregateRow[];
  devices: VisitsAggregateRow[];
};

// One 30-day window for everything, matching the Hobby-plan reporting
// window (see vercel.com/docs/analytics/limits-and-pricing) so this keeps
// working without changes if/when the project moves to Pro.
const WINDOW_DAYS = 30;

export async function getSiteAnalytics(): Promise<AnalyticsResult<SiteAnalytics>> {
  const { since, until } = dateRange(WINDOW_DAYS);

  const [totals, daily, topPages, topReferrers, devices] = await Promise.all([
    queryVercel<VisitsCount>("visits/count", { since, until }),
    queryVercel<VisitsAggregateRow[]>("visits/aggregate", { since, until, by: "day" }),
    queryVercel<VisitsAggregateRow[]>("visits/aggregate", { since, until, by: "route", limit: "8" }),
    queryVercel<VisitsAggregateRow[]>("visits/aggregate", {
      since,
      until,
      by: "referrerHostname",
      limit: "6",
    }),
    queryVercel<VisitsAggregateRow[]>("visits/aggregate", { since, until, by: "deviceType", limit: "5" }),
  ]);

  const firstError = [totals, daily, topPages, topReferrers, devices].find(
    (r): r is { ok: false; error: string } => !r.ok
  );
  if (firstError) return { ok: false, error: firstError.error };

  return {
    ok: true,
    data: {
      totals: (totals as { ok: true; data: VisitsCount }).data,
      daily: (daily as { ok: true; data: VisitsAggregateRow[] }).data,
      topPages: (topPages as { ok: true; data: VisitsAggregateRow[] }).data,
      topReferrers: (topReferrers as { ok: true; data: VisitsAggregateRow[] }).data,
      devices: (devices as { ok: true; data: VisitsAggregateRow[] }).data,
    },
  };
}
