"use client";

import { useState } from "react";
import Link from "next/link";
import RecapForm from "./RecapForm";
import { deleteRecap } from "./actions";

type Recap = {
  id: string;
  title: string;
  body: string;
  photo_url: string | null;
  event_id: string | null;
  published_at: string;
};

type EventOption = { id: string; name: string };

export default function RecapListItem({
  recap,
  events,
  editable,
}: {
  recap: Recap;
  events: EventOption[];
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <RecapForm recap={recap} events={events} onDone={() => setEditing(false)} />
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
      {recap.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recap.photo_url}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/recaps/${recap.id}`}
            target="_blank"
            className="font-semibold text-ivory hover:text-gold"
          >
            {recap.title}
          </Link>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-steel-light">
          {recap.body}
        </p>
        <p className="mt-1 text-xs text-steel-light">
          {new Date(recap.published_at).toLocaleDateString()}
        </p>
        {editable && (
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-steel-light hover:text-gold"
            >
              Edit
            </button>
            <form
              action={deleteRecap}
              onSubmit={(e) => {
                if (!confirm(`Delete "${recap.title}"? This can't be undone.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={recap.id} />
              <button
                type="submit"
                className="text-xs text-steel-light hover:text-red-400"
              >
                Delete
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
