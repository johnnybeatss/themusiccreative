"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitDjBooking, type DjBookingFormState } from "./actions";

const EXPERIENCE_OPTIONS = [
  "Just starting",
  "1-2 years",
  "3-5 years",
  "5+ years",
];

const initialState: DjBookingFormState = { error: null };
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";

export default function DjBookingForm() {
  const [state, formAction, isPending] = useActionState(
    submitDjBooking,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      formRef.current?.reset();
      setJustSubmitted(true);
    } else {
      setJustSubmitted(false);
    }
  }, [state]);

  if (justSubmitted) {
    return (
      <div className="mt-6 rounded-xl border border-gold/50 bg-navy-900 p-6">
        <p className="font-display text-lg tracking-wide text-gold">
          YOU&apos;RE ON THE LIST
        </p>
        <p className="mt-2 text-sm text-steel-light">
          Thanks for signing up — we&apos;ll reach out when we&apos;re
          booking a DJ that fits.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 max-w-lg space-y-4 rounded-xl border border-navy-800 bg-navy-900 p-5"
    >
      <label className={labelClass}>
        <span className="text-steel-light">Your name</span>
        <input
          type="text"
          name="requester_name"
          required
          className={inputClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-steel-light">Email</span>
          <input type="email" name="email" required className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Phone (optional)</span>
          <input type="tel" name="phone" className={inputClass} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-steel-light">Event date (optional)</span>
          <input type="date" name="event_date" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Expected guest count</span>
          <input
            type="text"
            name="guest_count"
            placeholder="e.g. ~150"
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-steel-light">Event type / venue</span>
        <input
          type="text"
          name="event_type"
          required
          placeholder="e.g. Sorority formal at The Wharf"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">
          Link to your page/work (Instagram, SoundCloud, Mixcloud, etc.)
        </span>
        <input
          type="text"
          name="portfolio_link"
          required
          placeholder="e.g. instagram.com/yourhandle"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">How long have you been DJing?</span>
        <select
          name="experience"
          required
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Select one
          </option>
          {EXPERIENCE_OPTIONS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">
          Anything else we should know? (optional)
        </span>
        <textarea name="details" rows={4} className={inputClass} />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Sign up"}
      </button>
    </form>
  );
}
