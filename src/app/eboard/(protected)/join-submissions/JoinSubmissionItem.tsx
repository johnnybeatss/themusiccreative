"use client";

import { useEffect, useRef, useState } from "react";
import { markJoinSubmissionRead } from "./actions";
import DeleteSubmissionButton from "./DeleteSubmissionButton";

export type JoinSubmission = {
  id: string;
  full_name: string;
  fiu_email: string;
  student_id: string;
  phone: string;
  major: string;
  year: string;
  creative_roles: string[];
  creative_role_other: string | null;
  experience_length: string;
  achievements: string | null;
  portfolio_link: string;
  club_goals: string;
  wants_collab: string;
  wants_to_perform: string;
  signed_to_label: string;
  workshop_ideas: string | null;
  created_at: string;
  read_at: string | null;
};

// Marks itself read the moment it actually scrolls into view — same
// IntersectionObserver pattern as FeedbackItem. Shared team-inbox model:
// once anyone's seen it, it's read for every owner/admin.
export default function JoinSubmissionItem({
  submission: s,
}: {
  submission: JoinSubmission;
}) {
  const [read, setRead] = useState(!!s.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRead(true);
          markJoinSubmissionRead(s.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, s.id]);

  return (
    <li
      ref={ref}
      className={`rounded-xl border p-4 transition-colors hover:border-gold ${
        read ? "border-navy-800 bg-navy-900" : "border-gold/50 bg-navy-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ivory">{s.full_name}</p>
          {!read && (
            <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-steel-light">
          {new Date(s.created_at).toLocaleString()}
        </p>
      </div>
      <p className="mt-1 text-sm text-steel-light">
        {s.fiu_email} · {s.phone} · {s.major} · {s.year}
      </p>
      <p className="mt-2 text-sm text-ivory">
        {s.creative_roles.join(", ")}
        {s.creative_role_other ? ` (${s.creative_role_other})` : ""} ·{" "}
        {s.experience_length}
      </p>
      <a
        href={
          s.portfolio_link.startsWith("http")
            ? s.portfolio_link
            : `https://${s.portfolio_link}`
        }
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-sm text-gold underline"
      >
        {s.portfolio_link}
      </a>
      <p className="mt-2 text-sm text-steel-light">
        <span className="text-ivory">Goals:</span> {s.club_goals}
      </p>
      <p className="mt-2 text-xs text-steel-light">
        Collab: {s.wants_collab} · Perform: {s.wants_to_perform} · Signed:{" "}
        {s.signed_to_label}
      </p>
      <div className="mt-3">
        <DeleteSubmissionButton id={s.id} name={s.full_name} />
      </div>
    </li>
  );
}
