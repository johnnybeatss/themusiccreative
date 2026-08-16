"use client";

import { useEffect, useRef, useState } from "react";
import { markFeedbackRead } from "./actions";
import DeleteFeedbackButton from "./DeleteFeedbackButton";

const CATEGORY_STYLES: Record<string, string> = {
  "Event idea": "border-gold text-gold",
  Like: "border-ivory/40 text-ivory",
  Dislike: "border-steel text-steel-light",
  General: "border-steel text-steel-light",
};

export type Feedback = {
  id: string;
  name: string | null;
  category: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

// Marks itself read the moment it actually scrolls into view — same
// IntersectionObserver pattern as VideoCard's autoplay trigger. Shared
// team-inbox model: once anyone's seen it, it's read for every owner/admin.
export default function FeedbackItem({ feedback }: { feedback: Feedback }) {
  const [read, setRead] = useState(!!feedback.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRead(true);
          markFeedbackRead(feedback.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, feedback.id]);

  return (
    <li
      ref={ref}
      className={`rounded-xl border p-4 transition-colors hover:border-gold ${
        read ? "border-navy-800 bg-navy-900" : "border-gold/50 bg-navy-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
              CATEGORY_STYLES[feedback.category] ??
              "border-steel text-steel-light"
            }`}
          >
            {feedback.category}
          </span>
          {!read && (
            <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
              New
            </span>
          )}
        </div>
        <DeleteFeedbackButton id={feedback.id} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-ivory">
        {feedback.message}
      </p>
      <p className="mt-2 text-xs text-steel-light">
        {feedback.name || "Anonymous"} ·{" "}
        {new Date(feedback.created_at).toLocaleString()}
      </p>
    </li>
  );
}
