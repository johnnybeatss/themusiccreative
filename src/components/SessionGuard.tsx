"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Keeps E-Board members signed in for a rolling 24 hours of activity, on
// top of Supabase's own cookie-based session. We use localStorage (not
// sessionStorage) specifically because it is NOT cleared when a tab or the
// whole browser closes — the point is: close the tab, close your laptop,
// come back tomorrow morning, still signed in, as long as it's been under
// 24 hours since you last actually used the E-Board area. Any activity
// (click, scroll, keypress) pushes the window forward another 24 hours.
//
// Only once MORE than 24 hours pass with zero activity does the next visit
// sign the user out and send them to the login form for a fresh magic link.
const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_ACTIVE_KEY = "eboard-last-active";
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;
// Don't write to localStorage on every single mousemove — once a minute is
// plenty to keep the rolling window alive without hammering storage.
const ACTIVITY_WRITE_THROTTLE_MS = 60 * 1000;

export default function SessionGuard() {
  const router = useRouter();
  const lastWriteRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();

    function stampActivity() {
      const now = Date.now();
      if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWriteRef.current = now;
      localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    }

    async function signOutAndRedirect() {
      localStorage.removeItem(LAST_ACTIVE_KEY);
      await supabase.auth.signOut();
      router.replace("/eboard/login");
    }

    const lastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY) ?? 0);
    const now = Date.now();

    if (lastActive && now - lastActive > SESSION_WINDOW_MS) {
      signOutAndRedirect();
      return;
    }

    stampActivity();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, stampActivity, { passive: true })
    );

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, stampActivity)
      );
    };
  }, [router]);

  return null;
}
