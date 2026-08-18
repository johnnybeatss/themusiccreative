import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Elevated access — bypasses Row Level Security entirely. Only for
// server-to-server jobs that run with no logged-in user/session, e.g. the
// weekly email cron route (src/app/api/cron/weekly-email-draft/route.ts).
//
// Never import this into anything a browser request can reach (a Server
// Action, a normal route handler hit by a client fetch, etc.) — those
// should keep using the cookie-based client from ./server.ts so RLS still
// applies. This mirrors why scripts/dev-login-link.mjs uses the service
// role key directly instead of a session.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
