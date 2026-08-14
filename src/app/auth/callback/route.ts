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
      // `welcome=1` is a one-time signal for SessionGuard: it marks this
      // load as the result of a real, just-completed sign-in (as opposed
      // to a plain page load on a lingering cookie), so it knows to start
      // trusting this browser session. Stripped from the URL immediately
      // on the client.
      const separator = next.includes("?") ? "&" : "?";
      return NextResponse.redirect(`${origin}${next}${separator}welcome=1`);
    }
  }

  return NextResponse.redirect(`${origin}/eboard/login?error=auth-failed`);
}
