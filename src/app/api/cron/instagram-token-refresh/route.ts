import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { getAccessToken, refreshAccessToken } from "@/lib/instagram/api";

// Weekly (vercel.json). Instagram long-lived tokens expire 60 days after they
// were issued or last refreshed. A token that lapses can't be refreshed, and
// the DM bot then stops until someone generates a new one by hand. Running
// weekly leaves about eight chances to recover from a failed run before
// that happens. Same CRON_SECRET lock as the other cron routes.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  try {
    const current = await getAccessToken(supabase);
    // Bot not set up yet: nothing to refresh, and not an error.
    if (!current) return NextResponse.json({ ok: true, skipped: "no token configured" });

    const { accessToken, expiresIn } = await refreshAccessToken(current);
    const now = new Date();
    const { error } = await supabase.from("instagram_credentials").upsert({
      id: 1,
      access_token: accessToken,
      expires_at: expiresIn ? new Date(now.getTime() + expiresIn * 1000).toISOString() : null,
      refreshed_at: now.toISOString(),
    });
    if (error) throw new Error(`instagram_credentials write failed: ${error.message}`);
    return NextResponse.json({ ok: true, expiresInDays: expiresIn ? Math.floor(expiresIn / 86400) : null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("instagram-token-refresh:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
