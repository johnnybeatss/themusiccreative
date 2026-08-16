"use client";

import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import OpportunityForm from "./OpportunityForm";
import { deleteOpportunity } from "./actions";

type Opportunity = {
  id: string;
  title: string;
  type: string;
  contact_link: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
};

const STALE_AFTER_DAYS = 60;

function daysOld(createdAt: string) {
  return Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function OpportunityListItem({
  opportunity,
  editable,
}: {
  opportunity: Opportunity;
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <OpportunityForm
        opportunity={opportunity}
        onDone={() => setEditing(false)}
      />
    );
  }

  const age = daysOld(opportunity.created_at);
  const isStale = age >= STALE_AFTER_DAYS;

  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
      <div className="flex items-start gap-3">
        {opportunity.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={opportunity.image_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-ivory">{opportunity.title}</p>
            <StatusPill status={opportunity.status} />
          </div>
          <p className="mt-1 text-sm text-steel-light">
            {opportunity.type} · posted {age === 0 ? "today" : `${age}d ago`}
            {isStale && " · hidden from public page (60+ days old)"}
          </p>
          {opportunity.contact_link && (
            <a
              href={opportunity.contact_link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-gold underline"
            >
              {opportunity.contact_link}
            </a>
          )}
        </div>
      </div>
      {editable && (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-steel-light hover:text-gold"
          >
            Edit
          </button>
          <form
            action={deleteOpportunity}
            onSubmit={(e) => {
              if (
                !confirm(
                  `Delete "${opportunity.title}"? This can't be undone.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={opportunity.id} />
            <button
              type="submit"
              className="text-xs text-steel-light hover:text-red-400"
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
