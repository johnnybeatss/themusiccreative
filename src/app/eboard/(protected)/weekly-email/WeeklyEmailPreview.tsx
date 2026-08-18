"use client";

import { useEffect, useRef, useState } from "react";
import { markWeeklyEmailDraftReviewed, sendWeeklyEmailDraft } from "./actions";

export type WeeklyEmailDraft = {
  id: string;
  week_start: string;
  week_end: string;
  subject: string;
  html: string;
  event_count: number;
  status: "draft" | "sent";
  reviewed_at: string | null;
  sent_at: string | null;
  created_at: string;
};

// Marks itself reviewed the moment it scrolls into view — same
// IntersectionObserver pattern as TeamApplicationItem/FeedbackItem/etc,
// just applied to a single draft instead of a list of many rows (there's
// only ever one active draft to review at a time).
export default function WeeklyEmailPreview({
  draft,
}: {
  draft: WeeklyEmailDraft;
}) {
  const [reviewed, setReviewed] = useState(!!draft.reviewed_at);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reviewed) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReviewed(true);
          markWeeklyEmailDraftReviewed(draft.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reviewed, draft.id]);

  return (
    <div
      ref={ref}
      className={`rounded-xl border p-5 ${
        reviewed ? "border-navy-800 bg-navy-900" : "border-gold/50 bg-navy-900"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ivory">{draft.subject}</p>
            {!reviewed && (
              <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
                New
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-steel-light">
            {draft.event_count} event{draft.event_count === 1 ? "" : "s"} ·
            drafted {new Date(draft.created_at).toLocaleString()}
          </p>
        </div>
        {draft.status === "draft" ? (
          <form
            action={sendWeeklyEmailDraft}
            onSubmit={(e) => {
              if (
                !confirm(
                  "Send this week's email to every newsletter subscriber? This can't be undone."
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={draft.id} />
            <button
              type="submit"
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light"
            >
              Send to subscribers
            </button>
          </form>
        ) : (
          <span className="rounded-lg border border-navy-800 px-3 py-1.5 text-xs font-semibold text-steel-light">
            Sent {draft.sent_at ? new Date(draft.sent_at).toLocaleString() : ""}
          </span>
        )}
      </div>

      <iframe
        srcDoc={draft.html}
        sandbox=""
        title={`Preview — ${draft.subject}`}
        className="mt-4 h-[520px] w-full rounded-lg border border-navy-800 bg-white"
      />
    </div>
  );
}
