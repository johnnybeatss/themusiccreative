"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { createEvent, updateEvent, type EventFormState } from "./actions";
import { isoToZonedDateTimeLocal } from "@/lib/eventTimezone";

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
  const photosInputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  // A native <input type="file"> REPLACES its FileList every time you open
  // the picker and choose again — it never accumulates across separate
  // "Choose Files" clicks. That's what made it look like the form "wouldn't
  // let you add more than one photo at a time": picking a 2nd batch wiped
  // out the 1st. This state holds everything staged so far; each new pick
  // gets merged in, then written back onto the real input via DataTransfer
  // so the native form submission (and Server Action FormData) still sees
  // the full set.
  const [stagedPhotos, setStagedPhotos] = useState<File[]>([]);
  const stagedPreviewUrls = useMemo(
    () => stagedPhotos.map((f) => URL.createObjectURL(f)),
    [stagedPhotos]
  );
  useEffect(() => {
    return () => stagedPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [stagedPreviewUrls]);

  function syncPhotosInput(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    if (photosInputRef.current) photosInputRef.current.files = dt.files;
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    const merged = [...stagedPhotos, ...picked];
    setStagedPhotos(merged);
    syncPhotosInput(merged);
  }

  function removeStagedPhoto(index: number) {
    const next = stagedPhotos.filter((_, i) => i !== index);
    setStagedPhotos(next);
    syncPhotosInput(next);
  }

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      if (!event) {
        formRef.current?.reset();
        setStagedPhotos([]);
      }
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
          <span className="text-steel-light">Date &amp; time (Eastern)</span>
          <input
            type="datetime-local"
            name="date"
            required
            defaultValue={
              event ? isoToZonedDateTimeLocal(event.date) : undefined
            }
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
      <div className="rounded-lg border border-navy-800 p-3">
        <label className="block text-sm">
          <span className="font-semibold uppercase tracking-wide text-steel-light">
            Cover image
          </span>
          <span className="ml-1.5 text-steel-light">
            {event ? "(optional — replaces current)" : "(optional)"}
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
            className="mt-2 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
          />
        </label>
        <p className="mt-1 text-xs text-steel-light">
          The single banner image at the top of the event page. Under 4MB.
        </p>
      </div>

      <div className="rounded-lg border border-navy-800 p-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-steel-light">
          Gallery photos
        </span>

        {event && event.photo_urls.length > 0 && (
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
        )}

        <label className="mt-3 block text-sm">
          <span className="text-steel-light">Add photos</span>
          <input
            ref={photosInputRef}
            type="file"
            name="photos"
            accept="image/*"
            multiple
            onChange={handlePhotosChange}
            className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
          />
        </label>
        <p className="mt-1 text-xs text-steel-light">
          Pick more than one at once (shift/cmd-click in the file picker),
          or add photos in separate batches — each new pick adds to the
          list below instead of replacing it. Under 4MB each.
        </p>

        {stagedPhotos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {stagedPhotos.map((file, i) => (
              <div key={`${file.name}-${file.lastModified}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stagedPreviewUrls[i]}
                  alt=""
                  className="h-16 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeStagedPhoto(i)}
                  aria-label={`Remove ${file.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy-950 text-steel-light transition-colors hover:text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
