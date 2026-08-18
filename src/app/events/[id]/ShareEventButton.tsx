"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

// Uses the native share sheet on mobile/supporting browsers (navigator.share),
// falling back to copy-to-clipboard everywhere else (most desktop browsers).
// No page's own URL is hardcoded — window.location.href always matches
// whatever domain the visitor is actually on.
export default function ShareEventButton({ eventName }: { eventName: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: eventName, url });
      } catch {
        // User cancelled the share sheet — not an error, do nothing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable/blocked — fail silently rather than
      // throwing an error at a visitor over a nice-to-have button.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-navy-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-steel-light transition-colors hover:border-gold hover:text-gold"
    >
      {copied ? (
        <>
          <Check size={14} />
          Copied
        </>
      ) : (
        <>
          <Share2 size={14} />
          Share
        </>
      )}
    </button>
  );
}
