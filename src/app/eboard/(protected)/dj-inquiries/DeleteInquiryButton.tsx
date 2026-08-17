"use client";

import { deleteDjInquiry } from "./actions";

export default function DeleteInquiryButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteDjInquiry}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}'s DJ sign-up? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-steel-light transition-colors hover:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}
