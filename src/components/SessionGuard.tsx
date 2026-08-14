"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Enforces two session rules for the E-Board area, layered on top of
// Supabase's own cookie-based session (which otherwise lasts indefinitely
// and auto-refreshes):
//
// 1. Idle timeout — sign out after 5 minutes with no mouse/keyboard/touch/
//    scroll activity.
// 2. "Browser was closed" timeout — sign out if this tab's browser session
//    doesn't trace back to a real sign-in. We can't just shorten the
//    Supabase auth cookie's lifetime: @supabase/ssr (confirmed by reading
//    the installed v0.10.0 source) always overwrites any custom `maxAge`
//    with its own default when it writes the cookie, so the cookie itself
//    stays valid for a long time no matter what. Instead we use
//    sessionStorage as a tripwire — it's cleared when the browser is fully
//    closed (all tabs/windows) but survives reloads and navigation within
//    the same browser session. The marker is only ever set in two places:
//    here, right after the `welcome=1` flag from a fresh magic-link
//    callback, or implicitly by staying within the same tab.
//
// Caveat (worth knowing, not a bug): sessionStorage is per-tab, so opening
// the E-Board area fresh in a brand-new tab of an already-open browser will
// also ask for sign-in again, not just a full browser restart. This is a
// UX/hygiene layer on top of the real auth gate (Supabase cookie + the
// server-side getUser() checks in proxy.ts and the protected layout) — it
// intentionally errs toward asking for sign-in a bit more often, not less.
const IDLE_LIMIT_MS = 5 * 60 * 1000;
const SESSION_MARKER = "eboard-session-active";
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

export default function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function signOutAndRedirect() {
      if (timerRef.current) clearTimeout(timerRef.current);
      sessionStorage.removeItem(SESSION_MARKER);
      await supabase.auth.signOut();
      router.replace("/eboard/login");
    }

    const justSignedIn = searchParams.get("welcome") === "1";

    if (justSignedIn) {
      sessionStorage.setItem(SESSION_MARKER, "1");
      // Strip the one-time flag so it can't linger in the URL/history.
      const params = new URLSearchParams(searchParams.toString());
      params.delete("welcome");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    } else if (!sessionStorage.getItem(SESSION_MARKER)) {
      // A valid-looking cookie session exists (we're inside the protected
      // layout at all), but this tab has no record of a sign-in happening
      // in it — treat it as stale and require a fresh login.
      signOutAndRedirect();
      return;
    }

    function resetIdleTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(signOutAndRedirect, IDLE_LIMIT_MS);
    }

    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, resetIdleTimer, { passive: true })
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, resetIdleTimer)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
