"use client";

import { useEffect, useRef, useState } from "react";
import { markTeamApplicationRead } from "./actions";
import DeleteApplicationButton from "./DeleteApplicationButton";

export type TeamApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role_interest: string;
  why_join: string | null;
  resume_path: string;
  resume_url: string | null;
  created_at: string;
  read_at: string | null;
};

// Marks itself read the moment it actually scrolls into view — same
// IntersectionObserver pattern as JoinSubmissionItem/DjInquiryItem/
// FeedbackItem. Shared team-inbox model: once anyone's seen it, it's read
// for every owner/admin.
export default function TeamApplicationItem({
  application: a,
}: {
  application: TeamApplication;
}) {
  const [read, setRead] = useState(!!a.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRead(true);
          markTeamApplicationRead(a.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, a.id]);

  return (
    <li
      ref={ref}
      className={`rounded-xl border p-4 transition-colors hover:border-gold ${
        read ? "border-navy-800 bg-navy-900" : "border-gold/50 bg-navy-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ivory">{a.full_name}</p>
          {!read && (
            <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-steel-light">
          {new Date(a.created_at).toLocaleString()}
        </p>
      </div>
      <p className="mt-1 text-sm text-steel-light">
        {a.email}
        {a.phone ? ` · ${a.phone}` : ""}
      </p>
      <p className="mt-2 text-sm text-ivory">
        Interested in: {a.role_interest}
      </p>
      {a.why_join && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-steel-light">
          {a.why_join}
        </p>
      )}
      {a.resume_url ? (
        <a
          href={a.resume_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-gold underline"
        >
          View resume ↗
        </a>
      ) : (
        <p className="mt-2 text-xs text-steel-light">
          Resume link unavailable — try refreshing the page.
        </p>
      )}
      <div className="mt-3">
        <DeleteApplicationButton
          id={a.id}
          name={a.full_name}
          resumePath={a.resume_path}
        />
      </div>
    </li>
  );
}
