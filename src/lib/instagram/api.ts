import "server-only";

// Thin Graph API client for Instagram messaging under Meta's "Instagram API
// setup with Unified login". Since late Oct 2026 that's the only setup new
// Meta apps get; it replaced "API setup with Instagram login". Differences
// from the old setup:
//  * Host is graph.facebook.com, not graph.instagram.com.
//  * The token is a system-user token owned by the business portfolio, and
//    it's configured to never expire, so there's nothing to refresh.
//  * Calls use the Instagram account ID in the path (/{ig-id}/messages);
//    /me would mean the system user, not the account.
//
// The version is pinned so a change to Meta's default can't change behavior
// without warning. To upgrade, set INSTAGRAM_GRAPH_API_VERSION after
// reading Meta's changelog.
const GRAPH_HOST = "https://graph.facebook.com";
const API_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION || "v26.0";
const TIMEOUT_MS = 10_000;

type GraphError = { error?: { message?: string; code?: number } };

async function graphFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GRAPH_HOST}/${API_VERSION}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || body.error) {
    const e = body.error;
    // Code 190 means an invalid or revoked token. See docs/instagram-dm-bot.md.
    throw new Error(`Graph API ${res.status}: ${e?.message ?? "unknown error"} (code ${e?.code ?? "?"})`);
  }
  return body;
}

export function getAccessToken(): string | null {
  return process.env.INSTAGRAM_ACCESS_TOKEN || null;
}

// Uses INSTAGRAM_ACCOUNT_ID when it's set. Otherwise asks Meta which
// Instagram account the token is assigned to, and caches the answer for
// as long as this server instance stays warm.
let cachedAccountId: Promise<string> | null = null;
export function getInstagramAccountId(token: string): Promise<string> {
  const fromEnv = process.env.INSTAGRAM_ACCOUNT_ID;
  if (fromEnv) return Promise.resolve(fromEnv);
  cachedAccountId ??= graphFetch<{ data?: { id?: string }[] }>("/me/assigned_instagram_accounts", token)
    .then((res) => {
      const ids = (res.data ?? []).map((a) => a.id).filter((id): id is string => !!id);
      if (ids.length !== 1) {
        throw new Error(`Expected 1 assigned Instagram account, got ${ids.length}; set INSTAGRAM_ACCOUNT_ID`);
      }
      return ids[0];
    })
    .catch((err) => {
      cachedAccountId = null; // don't cache failures
      throw err;
    });
  return cachedAccountId;
}

// Sends a plain-text DM to an Instagram-scoped user ID (IGSID) and returns
// Meta's message ID. Replying to someone who just messaged us is always
// inside Meta's standard messaging window.
export async function sendTextMessage(
  token: string,
  accountId: string,
  recipientId: string,
  text: string
): Promise<string> {
  const res = await graphFetch<{ message_id?: string }>(`/${accountId}/messages`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  if (!res.message_id) throw new Error("Graph API: send succeeded but returned no message_id");
  return res.message_id;
}
