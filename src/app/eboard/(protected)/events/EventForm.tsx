"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEvent, updateEvent, type EventFormState } from "./actions";

const EVENT_TYPES = ["Workshop", "Showcase", "Mixer", "Other"] as const;
const EVENT_STATUSES = ["Not started", "In progress", "Done"] as const;

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

const initialState: EventFormState = { error: null };

// datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone suffix —
// build it from the stored timestamp in local time.
function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Same form handles both "add a new event" (no `event` prop, posts to
// createEvent) and "edit an existing one" (posts to updateEvent) — keeps
// the fields/validation/styling in one place instead of two near-duplicates.
export default function EventForm({
  event,
  onDone,
}: {
  event?: Event;
  onDone?: () => void;
}) {
  const action = event ? updateEvent : createEvent;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      if (!event) formRef.current?.reset();
      onDone?.();
    }
    // onDone intentionally omitted — including it would re-run this effect
    // whenever the parent re-renders with a new inline function reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, event]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <h2 className="font-display text-lg tracking-wide text-ivory">
        {event ? "EDIT EVENT" : "ADD AN EVENT"}
      </h2>
      {event && <input type="hidden" name="id" value={event.id} />}
      <label className="block text-sm">
        <span className="text-steel-light">Name</span>
        <input
          type="text"
          name="name"
          required
          defaultValue={event?.name}
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Date &amp; time</span>
          <input
            type="datetime-local"
            name="date"
            required
            defaultValue={event ? toDateTimeLocal(event.date) : undefined}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Location</span>
          <input
            type="text"
            name="location"
            defaultValue={event?.location ?? ""}
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Type</span>
          <select
            name="type"
            defaultValue={event?.type ?? "Other"}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Status</span>
          <select
            name="status"
            defaultValue={event?.status ?? "Not started"}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          >
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">Description (optional)</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={event?.description ?? ""}
          placeholder="Shows on the event's public page"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">
          Workshop guest&apos;s Instagram (optional)
        </span>
        <input
          type="url"
          name="guest_instagram_url"
          defaultValue={event?.guest_instagram_url ?? ""}
          placeholder="https://instagram.com/handle"
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">
          Cover image {event ? "(optional — replaces current)" : "(optional)"}
        </span>
        {event?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt=""
            className="mt-2 h-24 w-full rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
      </label>
      <p className="text-xs text-steel-light">Under 4MB.</p>

      {event && event.photo_urls.length > 0 && (
        <div className="block text-sm">
          <span className="text-steel-light">Gallery photos</span>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {event.photo_urls.map((url) => (
              <label key={url} className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-16 w-full rounded-lg object-cover"
                />
                <span className="mt-1 flex items-center gap-1 text-xs text-steel-light">
                  <input
                    type="checkbox"
                    name="keep_photo"
                    value={url}
                    defaultChecked
                    className="h-3.5 w-3.5 rounded border-navy-800 bg-navy-950 accent-gold"
                  />
                  Keep
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      <label className="block text-sm">
        <span className="text-steel-light">Add gallery photos (optional)</span>
        <input
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
        <span className="mt-1 block text-xs text-steel-light">
          Shows in a gallery on the event&apos;s public page. Under 4MB each.
        </span>
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {isPending ? "Saving..." : event ? "Save changes" : "Add event"}
        </button>
        {event && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-steel-light hover:text-ivory"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
