"use client";

import { useEffect, useRef, useState } from "react";
import { markDjInquiryRead } from "./actions";
import DeleteInquiryButton from "./DeleteInquiryButton";

export type DjInquiry = {
  id: string;
  requester_name: string;
  email: string;
  phone: string | null;
  event_date: string | null;
  event_type: string;
  guest_count: string | null;
  budget_range: string | null;
  portfolio_link: string | null;
  experience: string | null;
  details: string | null;
  created_at: string;
  read_at: string | null;
};

// Marks itself read the moment it actually scrolls into view — same
// IntersectionObserver pattern as FeedbackItem. Shared team-inbox model:
// once anyone's seen it, it's read for every owner/admin.
export default function DjInquiryItem({ inquiry: inq }: { inquiry: DjInquiry }) {
  const [read, setRead] = useState(!!inq.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRead(true);
          markDjInquiryRead(inq.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, inq.id]);

  return (
    <li
      ref={ref}
      className={`rounded-xl border p-4 transition-colors hover:border-gold ${
        read ? "border-navy-800 bg-navy-900" : "border-gold/50 bg-navy-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ivory">{inq.requester_name}</p>
          {!read && (
            <span className="inline-block rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-steel-light">
          {new Date(inq.created_at).toLocaleString()}
        </p>
      </div>
      <p className="mt-1 text-sm text-steel-light">
        {inq.email}
        {inq.phone ? ` · ${inq.phone}` : ""}
      </p>
      <p className="mt-2 text-sm text-ivory">{inq.event_type}</p>
      <p className="mt-1 text-sm text-steel-light">
        {inq.event_date
          ? new Date(inq.event_date).toLocaleDateString()
          : "Date TBD"}
        {inq.guest_count ? ` · ~${inq.guest_count} guests` : ""}
        {inq.budget_range ? ` · Budget: ${inq.budget_range}` : ""}
      </p>
      {inq.experience && (
        <p className="mt-1 text-sm text-steel-light">
          Experience: {inq.experience}
        </p>
      )}
      {inq.portfolio_link && (
        <a
          href={
            inq.portfolio_link.startsWith("http")
              ? inq.portfolio_link
              : `https://${inq.portfolio_link}`
          }
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-sm text-gold underline"
        >
          {inq.portfolio_link}
        </a>
      )}
      {inq.details && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-steel-light">
          {inq.details}
        </p>
      )}
      <div className="mt-3">
        <DeleteInquiryButton id={inq.id} name={inq.requester_name} />
      </div>
    </li>
  );
}
