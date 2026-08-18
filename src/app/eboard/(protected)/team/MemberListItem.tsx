"use client";

import { useState } from "react";
import MemberForm from "./MemberForm";
import { deleteMember } from "./actions";

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

export default function MemberListItem({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <MemberForm member={member} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
      {member.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photo_url}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-navy-950">
          <span className="font-display text-lg text-steel-light">
            {member.name.charAt(0)}
          </span>
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold text-ivory">{member.name}</p>
        <p className="text-xs text-steel-light">{member.role}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-steel-light hover:text-gold"
        >
          Edit
        </button>
        <form
          action={deleteMember}
          onSubmit={(e) => {
            if (!confirm(`Remove ${member.name} from the team page?`)) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={member.id} />
          <button
            type="submit"
            className="text-xs text-steel-light transition-colors hover:text-red-400"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
