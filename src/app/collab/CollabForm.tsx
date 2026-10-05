"use client";

import { useActionState } from "react";
import HoneypotFields from "@/components/HoneypotFields";
import { COLLAB_ROLES } from "@/lib/collab";
import { submitCollabPost, type CollabFormState } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 focus:border-gold focus:outline-none";

export default function CollabForm() {
  const [state, formAction, isPending] = useActionState<CollabFormState, FormData>(
    submitCollabPost,
    { error: null }
  );

  if (state.done) {
    return (
      <div className="rounded-xl border border-gold/50 bg-navy-900 p-5">
        <p className="font-semibold text-ivory">Got it.</p>
        <p className="mt-1 text-sm text-steel-light">
          E-Board will review it and it&apos;ll show up on the board once approved.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="relative space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-5">
      <HoneypotFields />
      <p className="font-display text-lg tracking-wide text-ivory">POST A COLLAB</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Name / artist name</span>
          <input name="name" required maxLength={60} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">I&apos;m a...</span>
          <select name="role" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Pick one
            </option>
            {COLLAB_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">Looking for</span>
        <input name="looking_for" required maxLength={120} placeholder="e.g. R&B vocalist for a finished beat" className={inputClass} />
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">Details (optional)</span>
        <textarea name="details" rows={3} maxLength={600} placeholder="Vibe, references, timeline..." className={inputClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Instagram (how people reach you)</span>
          <input name="instagram" required placeholder="@handle" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Link to your work (optional)</span>
          <input name="sample_url" type="url" placeholder="https://soundcloud.com/..." className={inputClass} />
        </label>
      </div>
      <p className="text-xs text-steel-light">
        Don&apos;t put your phone number or email in here — people will DM you on Instagram.
      </p>
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Posting..." : "Submit for review"}
      </button>
    </form>
  );
}
