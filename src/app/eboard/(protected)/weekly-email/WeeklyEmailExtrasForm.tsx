"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveWeeklyEmailExtras, type ExtrasFormState } from "./actions";

export type WeeklyEmailExtras = {
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  subject_override: string | null;
  member_spotlight_name: string | null;
  member_spotlight_text: string | null;
  member_spotlight_link: string | null;
  recap_photo_url: string | null;
  recap_caption: string | null;
};

const initialState: ExtrasFormState = { error: null };

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";
const sublabelClass = "text-steel-light";

// Everything here is optional and feeds NEXT week's draft, not the one
// currently showing below — see 0023_weekly_email_extras.sql and the cron
// route for how each field is consumed (and then cleared).
export default function WeeklyEmailExtrasForm({
  extras,
}: {
  extras: WeeklyEmailExtras;
}) {
  const [state, formAction, isPending] = useActionState(
    saveWeeklyEmailExtras,
    initialState
  );

  // Nothing on screen visibly changes after a successful save (the fields
  // just keep showing the same values you typed), so without this there's
  // no feedback that anything actually happened. Skips the very first
  // render so it doesn't flash "Saved" before you've submitted anything.
  const [showSaved, setShowSaved] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-6 space-y-5 rounded-xl border border-navy-800 bg-navy-900 p-5"
    >
      <div>
        <h2 className="font-display text-lg tracking-wide text-ivory">
          QUEUE CONTENT FOR NEXT WEEK
        </h2>
        <p className="mt-1 text-sm text-steel-light">
          Everything below is optional. Leave a section blank and it just
          won&apos;t appear in the email. Whatever you fill in gets used
          once, then this clears itself out.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-ivory">Primary CTA</p>
        <p className="mt-0.5 text-xs text-steel-light">
          The banner at the top of the email. Leave blank to auto-pick the
          nearest upcoming event.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={sublabelClass}>Label</span>
            <input
              type="text"
              name="primary_cta_label"
              placeholder="e.g. RSVP for the songwriting workshop"
              defaultValue={extras.primary_cta_label ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={sublabelClass}>Link</span>
            <input
              type="url"
              name="primary_cta_url"
              placeholder="https://themusiccreative.org/events/..."
              defaultValue={extras.primary_cta_url ?? ""}
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <label className={labelClass}>
        <span className={sublabelClass}>
          Subject line override — leave blank to auto-generate
        </span>
        <input
          type="text"
          name="subject_override"
          placeholder="e.g. 3 spots left for the Mike River workshop"
          defaultValue={extras.subject_override ?? ""}
          className={inputClass}
        />
      </label>

      <div>
        <p className="text-sm font-semibold text-ivory">Member spotlight</p>
        <p className="mt-0.5 text-xs text-steel-light">
          Needs both a name and a blurb to show up — link is optional.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span className={sublabelClass}>Name</span>
            <input
              type="text"
              name="member_spotlight_name"
              defaultValue={extras.member_spotlight_name ?? ""}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={sublabelClass}>Link (optional)</span>
            <input
              type="url"
              name="member_spotlight_link"
              placeholder="Instagram, track link, etc."
              defaultValue={extras.member_spotlight_link ?? ""}
              className={inputClass}
            />
          </label>
        </div>
        <label className={`${labelClass} mt-3`}>
          <span className={sublabelClass}>What&apos;s the update?</span>
          <textarea
            name="member_spotlight_text"
            rows={3}
            defaultValue={extras.member_spotlight_text ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-ivory">Last week's recap</p>
        <p className="mt-0.5 text-xs text-steel-light">
          Only appears if a photo is attached — no photo, no recap section.
        </p>
        {extras.recap_photo_url && (
          <div className="mt-2 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={extras.recap_photo_url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover"
            />
            <label className="flex items-center gap-2 text-xs text-steel-light">
              <input type="checkbox" name="remove_photo" className="accent-gold" />
              Remove this photo
            </label>
          </div>
        )}
        <label className={`${labelClass} mt-2`}>
          <span className={sublabelClass}>
            {extras.recap_photo_url ? "Replace photo" : "Photo"}
          </span>
          <input
            type="file"
            name="recap_photo"
            accept="image/*"
            className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
          />
          <span className="mt-1 block text-xs text-steel-light">
            Under 4MB.
          </span>
        </label>
        <label className={`${labelClass} mt-2`}>
          <span className={sublabelClass}>Caption (optional)</span>
          <input
            type="text"
            name="recap_caption"
            defaultValue={extras.recap_caption ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save for next week"}
        </button>
        {showSaved && (
          <span className="text-sm font-semibold text-gold">Saved ✓</span>
        )}
      </div>
    </form>
  );
}
