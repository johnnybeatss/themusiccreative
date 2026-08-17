"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitRsvp, type RsvpFormState } from "./actions";

const initialState: RsvpFormState = { error: null };
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";

export default function RsvpForm({ eventId }: { eventId: string }) {
  const [state, formAction, isPending] = useActionState(
    submitRsvp,
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
          YOU&apos;RE RSVP&apos;D
        </p>
        <p className="mt-2 text-sm text-steel-light">
          See you there — reach out on Instagram if anything changes.
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
      <input type="hidden" name="event_id" value={eventId} />
      <h2 className="font-display text-lg tracking-wide text-ivory">RSVP</h2>
      <label className={labelClass}>
        <span className="text-steel-light">Your name</span>
        <input type="text" name="name" required className={inputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="text-steel-light">Email</span>
          <input type="email" name="email" required className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Bringing anyone? (optional)</span>
          <input
            type="text"
            name="guest_count"
            placeholder="e.g. +1"
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        <span className="text-steel-light">Anything else? (optional)</span>
        <textarea name="notes" rows={3} className={inputClass} />
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "RSVP"}
      </button>
    </form>
  );
}
