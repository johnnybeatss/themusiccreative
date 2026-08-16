"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitJoinForm, type JoinFormState } from "./actions";

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];
const EXPERIENCE_LENGTHS = [
  "Just starting",
  "1-2 years",
  "3-5 years",
  "5+ years",
];
const CREATIVE_ROLES = [
  "Music Producer",
  "Artist/Vocalist",
  "DJ",
  "Camera person/Videographer",
  "Digital artist",
  "Sound Engineer",
  "Graphic Designer",
  "Songwriter",
];

const initialState: JoinFormState = { error: null };

const inputClass =
  "mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none";
const labelClass = "block text-sm";
const sectionClass =
  "space-y-4 rounded-xl border border-navy-800 bg-navy-900 p-5";

// Same 15 questions as the club's Google Form intake, across the same 3
// sections — kept as one native page instead of an embed so members never
// leave the site. Submits to join_submissions (owner/admin-only reads —
// see supabase/migrations/0014_join_and_dj_inquiries.sql).
export default function JoinForm() {
  const [state, formAction, isPending] = useActionState(
    submitJoinForm,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showOtherRole, setShowOtherRole] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      formRef.current?.reset();
      setShowOtherRole(false);
      setJustSubmitted(true);
    } else {
      setJustSubmitted(false);
    }
  }, [state]);

  if (justSubmitted) {
    return (
      <div className="mt-6 rounded-xl border border-gold/50 bg-navy-900 p-6">
        <p className="font-display text-lg tracking-wide text-gold">
          YOU&apos;RE IN THE QUEUE
        </p>
        <p className="mt-2 text-sm text-steel-light">
          Thanks for filling it out — we&apos;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 max-w-xl space-y-6"
    >
      <div className={sectionClass}>
        <h2 className="font-display text-lg tracking-wide text-ivory">
          BASIC INFO
        </h2>
        <label className={labelClass}>
          <span className="text-steel-light">First and Last name</span>
          <input
            type="text"
            name="full_name"
            required
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">FIU Email</span>
          <input type="email" name="fiu_email" required className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">FIU Student ID</span>
          <input type="text" name="student_id" required className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Phone number</span>
          <input type="tel" name="phone" required className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Major/area of study</span>
          <input type="text" name="major" required className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">Year at FIU</span>
          <select name="year" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select one
            </option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={sectionClass}>
        <h2 className="font-display text-lg tracking-wide text-ivory">
          CREATIVE BACKGROUND
        </h2>
        <fieldset>
          <legend className="text-sm text-steel-light">
            What best describes your creative role(s)? (Check all that apply)
          </legend>
          <div className="mt-2 space-y-2">
            {CREATIVE_ROLES.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2 text-sm text-ivory"
              >
                <input
                  type="checkbox"
                  name="creative_roles"
                  value={role}
                  className="h-4 w-4 rounded border-navy-800 bg-navy-950 accent-gold"
                />
                {role}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-ivory">
              <input
                type="checkbox"
                name="creative_roles"
                value="Other"
                checked={showOtherRole}
                onChange={(e) => setShowOtherRole(e.target.checked)}
                className="h-4 w-4 rounded border-navy-800 bg-navy-950 accent-gold"
              />
              Other
            </label>
            {showOtherRole && (
              <input
                type="text"
                name="creative_role_other"
                placeholder="Tell us what"
                className={inputClass}
              />
            )}
          </div>
        </fieldset>
        <label className={labelClass}>
          <span className="text-steel-light">
            How long have you been involved in your craft?
          </span>
          <select
            name="experience_length"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select one
            </option>
            {EXPERIENCE_LENGTHS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">
            Any notable achievements (placements, awards, etc?)
          </span>
          <input type="text" name="achievements" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className="text-steel-light">
            Drop your social or portfolio link (Instagram, YouTube, SoundCloud,
            etc.)
          </span>
          <input
            type="text"
            name="portfolio_link"
            required
            className={inputClass}
          />
        </label>
      </div>

      <div className={sectionClass}>
        <h2 className="font-display text-lg tracking-wide text-ivory">
          INVOLVEMENT &amp; INTEREST
        </h2>
        <label className={labelClass}>
          <span className="text-steel-light">
            What are you hoping to gain from this club?
          </span>
          <textarea
            name="club_goals"
            required
            rows={3}
            className={inputClass}
          />
        </label>
        <fieldset>
          <legend className="text-sm text-steel-light">
            Are you interested in collaborating with other members?
          </legend>
          <div className="mt-2 flex gap-4">
            {["yes", "no", "maybe"].map((v) => (
              <label
                key={v}
                className="flex items-center gap-1.5 text-sm capitalize text-ivory"
              >
                <input type="radio" name="wants_collab" value={v} required />
                {v}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm text-steel-light">
            Would you be interested in performing, showcasing, or speaking at
            an event in the future?
          </legend>
          <div className="mt-2 flex gap-4">
            {["yes", "no", "maybe"].map((v) => (
              <label
                key={v}
                className="flex items-center gap-1.5 text-sm capitalize text-ivory"
              >
                <input
                  type="radio"
                  name="wants_to_perform"
                  value={v}
                  required
                />
                {v}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm text-steel-light">
            Are you signed to a label or distribution company?
          </legend>
          <div className="mt-2 flex gap-4">
            {["yes", "no"].map((v) => (
              <label
                key={v}
                className="flex items-center gap-1.5 text-sm capitalize text-ivory"
              >
                <input
                  type="radio"
                  name="signed_to_label"
                  value={v}
                  required
                />
                {v}
              </label>
            ))}
          </div>
        </fieldset>
        <label className={labelClass}>
          <span className="text-steel-light">
            What kind of events or workshops would you like to see us host?
          </span>
          <textarea name="workshop_ideas" rows={3} className={inputClass} />
        </label>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
