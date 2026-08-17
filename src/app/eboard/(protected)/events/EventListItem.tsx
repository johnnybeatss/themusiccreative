"use client";

import { useState } from "react";
import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import EventForm from "./EventForm";
import { deleteEvent } from "./actions";
import { formatEventDateTime } from "@/lib/eventTimezone";

type Event = {
  id: string;
  name: string;
  date: string;
  location: string | null;
  type: string;
  status: string;
  description: string | null;
  guest_instagram_url: string | null;
  image_url: string | null;
  photo_urls: string[];
};

export default function EventListItem({
  event,
  editable,
}: {
  event: Event;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EventForm event={event} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
      <div className="flex items-start gap-3">
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-ivory">{event.name}</p>
            <StatusPill status={event.status} />
          </div>
        </div>
      </div>
      <p className="mt-1 text-sm text-steel-light">
        {formatEventDateTime(event.date)}
        {event.location ? ` · ${event.location}` : ""} · {event.type}
      </p>
      {editable && (
        <div className="mt-3 flex items-center gap-4">
          <Link
            href={`/eboard/events/${event.id}/rsvps`}
            className="text-xs text-steel-light hover:text-gold"
          >
            View RSVPs
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-steel-light hover:text-gold"
          >
            Edit
          </button>
          <form
            action={deleteEvent}
            onSubmit={(e) => {
              if (!confirm(`Delete "${event.name}"? This can't be undone.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={event.id} />
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
  );
}
