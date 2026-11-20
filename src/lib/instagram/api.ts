import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Thin client for the Instagram API with Instagram Login (graph.instagram.com).
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
//
// The version is pinned so a change to Meta's default version can't change
// behavior without warning. To upgrade, set INSTAGRAM_GRAPH_API_VERSION
// after reading the changelog.
const GRAPH_HOST = "https://graph.instagram.com";
const API_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION || "v26.0";
const TIMEOUT_MS = 10_000;

type GraphError = { error?: { message?: string; code?: number; type?: string } };

async function graphFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || body.error) {
    const e = body.error;
    // Code 190 means an expired or invalid token. See docs/instagram-dm-bot.md.
    throw new Error(`Instagram API ${res.status}: ${e?.message ?? "unknown error"} (code ${e?.code ?? "?"})`);
  }
  return body;
}

// The stored (auto-refreshed) token comes first. The env var only
// bootstraps it: the first cron run copies a refreshed token into the
// table, and from then on the table wins.
export async function getAccessToken(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("instagram_credentials")
    .select("access_token")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`instagram_credentials read failed: ${error.message}`);
  return data?.access_token ?? process.env.INSTAGRAM_ACCESS_TOKEN ?? null;
}

// Sends a plain-text DM to an Instagram-scoped user ID (IGSID) and returns
// Meta's message ID. Replying to someone who just messaged us is always
// inside Meta's standard messaging window.
export async function sendTextMessage(token: string, recipientId: string, text: string): Promise<string> {
  const res = await graphFetch<{ message_id?: string }>(`${GRAPH_HOST}/${API_VERSION}/me/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  if (!res.message_id) throw new Error("Instagram API: send succeeded but returned no message_id");
  return res.message_id;
}

// Exchanges a long-lived token (at least 24h old, not yet expired) for a new
// one valid for 60 more days.
// https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token
export async function refreshAccessToken(token: string): Promise<{ accessToken: string; expiresIn: number | null }> {
  const url = `${GRAPH_HOST}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`;
  const res = await graphFetch<{ access_token?: string; expires_in?: number }>(url);
  if (!res.access_token) throw new Error("Instagram API: refresh returned no access_token");
  return { accessToken: res.access_token, expiresIn: res.expires_in ?? null };
}
