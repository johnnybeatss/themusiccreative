import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect from the magic-link email: exchanges the one-time
// code in the URL for a real session (sets the auth cookies via the
// server client's cookie adapter), then sends the user into /eboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/eboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Short-lived marker cookie (NOT the auth session — that's set
      // separately by the Supabase server client above) that tells
      // SessionGuard "a real sign-in just completed in this browser tab."
      // This is a plain cookie we control directly, since @supabase/ssr
      // always overwrites maxAge on its own auth cookies with its own
      // default (confirmed by reading the installed package's source) —
      // it can't be repurposed for a short-lived flag like this.
      response.cookies.set("eboard_fresh_login", "1", {
        maxAge: 60,
        path: "/",
        sameSite: "lax",
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/eboard/login?error=auth-failed`);
}
