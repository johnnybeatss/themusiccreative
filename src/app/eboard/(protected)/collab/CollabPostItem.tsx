"use client";

import { useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";
import type { CollabPost } from "@/lib/collab";
import { COLLAB_POST_DAYS } from "@/lib/collab";
import { markCollabPostRead, setCollabApproved, deleteCollabPost } from "./actions";

const pill = "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide";

// Same IntersectionObserver read-tracking as the other E-Board inboxes.
export default function CollabPostItem({ post: p }: { post: CollabPost }) {
  const [read, setRead] = useState(!!p.read_at);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (read) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([hit]) => {
        if (hit.isIntersecting) {
          setRead(true);
          markCollabPostRead(p.id);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [read, p.id]);

  const expired =
    !!p.approved_at && Date.now() - new Date(p.approved_at).getTime() > COLLAB_POST_DAYS * 86400000;

  return (
    <li ref={ref} className={`rounded-xl border bg-navy-900 p-4 ${read ? "border-navy-800" : "border-gold/50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${pill} border border-gold text-accent`}>{p.role}</span>
          <p className="font-semibold text-ivory">{p.looking_for}</p>
          {!read && <span className={`${pill} bg-gold text-white`}>New</span>}
          {p.approved_at ? (
            <span className={`${pill} border border-navy-800 text-steel-light`}>{expired ? "Expired" : "Live"}</span>
          ) : (
            <span className={`${pill} border border-navy-800 text-steel-light`}>Pending</span>
          )}
        </div>
        <p className="text-xs text-steel-light">{new Date(p.created_at).toLocaleString()}</p>
      </div>
      <p className="mt-1 text-sm text-steel-light">{p.name}</p>
      {p.details && <p className="mt-2 whitespace-pre-line text-sm text-steel-light">{p.details}</p>}
      <div className="mt-2 flex flex-wrap gap-4 text-xs">
        <a href={p.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-steel-light hover:text-accent">
          <Instagram size={12} /> {p.instagram_url}
        </a>
        {p.sample_url && (
          <a href={p.sample_url} target="_blank" rel="noreferrer nofollow" className="break-all text-accent hover:underline">
            {p.sample_url}
          </a>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <form action={setCollabApproved}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="approve" value={p.approved_at && !expired ? "0" : "1"} />
          <button
            type="submit"
            className="rounded-full border border-gold px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-gold hover:text-white"
          >
            {!p.approved_at ? "Approve" : expired ? "Repost (30 days)" : "Take down"}
          </button>
        </form>
        <form
          action={deleteCollabPost}
          onSubmit={(e) => {
            if (!confirm("Delete this post? This can't be undone.")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={p.id} />
          <button type="submit" className="text-xs text-steel-light hover:text-red-400">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
