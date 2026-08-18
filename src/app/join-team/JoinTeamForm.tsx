"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitTeamApplication, type JoinTeamFormState } from "./actions";

const initialState: JoinTeamFormState = { error: null };
const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";

export default function JoinTeamForm() {
  const [state, formAction, isPending] = useActionState(
    submitTeamApplication,
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
          APPLICATION RECEIVED
        </p>
        <p className="mt-2 text-sm text-steel-light">
          Thanks for applying — we&apos;ll reach out if it&apos;s a fit.
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
        <input type="text" name="full_name" required className={inputClass} />
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
      <label className={labelClass}>
        <span className="text-steel-light">
          What role are you interested in?
        </span>
        <input
          type="text"
          name="role_interest"
          required
          placeholder="e.g. Marketing, Operations, Content"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">
          Why do you want to join the team? (optional)
        </span>
        <textarea name="why_join" rows={4} className={inputClass} />
      </label>
      <label className={labelClass}>
        <span className="text-steel-light">Resume (PDF)</span>
        <input
          type="file"
          name="resume"
          accept="application/pdf"
          required
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
        <span className="mt-1 block text-xs text-steel-light">
          PDF only, under 4MB.
        </span>
      </label>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
