"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMember, updateMember, type MemberFormState } from "./actions";

type Member = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  sort_order: number;
};

const initialState: MemberFormState = { error: null };

// Same form handles both "add a new member" (no `member` prop, posts to
// createMember) and "edit an existing one" (posts to updateMember) — same
// pattern as EventForm.
export default function MemberForm({
  member,
  onDone,
  nextOrder,
}: {
  member?: Member;
  onDone?: () => void;
  // Only used for new members (see TeamAdminPage) — the next open spot at
  // the end of the list, so adding someone doesn't require picking a
  // number at all unless you want to insert them somewhere specific.
  nextOrder?: number;
}) {
  const action = member ? updateMember : createMember;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (state.error === null) {
      if (!member) formRef.current?.reset();
      onDone?.();
    }
    // onDone intentionally omitted — see EventForm for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, member]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-6 space-y-3 rounded-xl border border-navy-800 bg-navy-900 p-4"
    >
      <h2 className="font-display text-lg tracking-wide text-ivory">
        {member ? "EDIT MEMBER" : "ADD A MEMBER"}
      </h2>
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Name</span>
          <input
            type="text"
            name="name"
            required
            defaultValue={member?.name}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">Role</span>
          <input
            type="text"
            name="role"
            required
            placeholder="e.g. Marketing Director"
            defaultValue={member?.role}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">Bio (optional)</span>
        <textarea
          name="bio"
          rows={4}
          defaultValue={member?.bio ?? ""}
          className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-steel-light">Instagram (optional)</span>
          <input
            type="url"
            name="instagram_url"
            placeholder="https://instagram.com/handle"
            defaultValue={member?.instagram_url ?? ""}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="text-steel-light">LinkedIn (optional)</span>
          <input
            type="url"
            name="linkedin_url"
            placeholder="https://linkedin.com/in/handle"
            defaultValue={member?.linkedin_url ?? ""}
            className="mt-1 w-full rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory placeholder:text-steel-light/60 transition-colors focus:border-gold focus:outline-none"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-steel-light">
          Display order (lower shows first)
        </span>
        <input
          type="number"
          name="sort_order"
          defaultValue={member?.sort_order ?? nextOrder ?? 0}
          className="mt-1 w-32 rounded-lg border border-navy-800 bg-navy-950 px-3 py-2 text-sm text-ivory transition-colors focus:border-gold focus:outline-none"
        />
        <span className="mt-1 block text-xs text-steel-light">
          {member
            ? "Change it to move them — everyone in between shifts automatically."
            : "Defaults to the end of the list — set a number to insert them there instead."}
        </span>
      </label>
      <label className="block text-sm">
        <span className="text-steel-light">
          Photo {member ? "(optional — replaces current)" : "(optional)"}
        </span>
        {member?.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photo_url}
            alt=""
            className="mt-2 h-24 w-24 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1 block w-full text-sm text-steel-light file:mr-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-navy-950 hover:file:bg-gold-light"
        />
        <span className="mt-1 block text-xs text-steel-light">
          Under 4MB.
        </span>
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light disabled:opacity-50"
        >
          {isPending ? "Saving..." : member ? "Save changes" : "Add member"}
        </button>
        {member && (
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
