import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import type { CollabPost } from "@/lib/collab";
import CollabPostItem from "./CollabPostItem";

export default async function CollabAdminPage() {
  const role = await getEffectiveRole();
  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">COLLAB BOARD</h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">Collab posts are reviewed by owner/admin accounts.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collab_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("Failed to load collab posts:", error.message);
  const posts = (data ?? []) as CollabPost[];
  const pending = posts.filter((p) => !p.approved_at);
  const reviewed = posts.filter((p) => p.approved_at);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">COLLAB BOARD</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Nothing shows on the{" "}
        <Link href="/collab" className="text-accent hover:underline">
          public board
        </Link>{" "}
        until it&apos;s approved here. Approved posts stay up 30 days. Reject
        anything with phone numbers/emails in it, spam, or sketchy links.
      </p>

      <h2 className="mt-8 font-display text-xl tracking-wide text-ivory">
        NEEDS REVIEW <span className="text-steel-light">({pending.length})</span>
      </h2>
      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-steel-light">All caught up.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {pending.map((p) => (
            <CollabPostItem key={p.id} post={p} />
          ))}
        </ul>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl tracking-wide text-ivory">APPROVED</h2>
          <ul className="mt-3 space-y-3">
            {reviewed.map((p) => (
              <CollabPostItem key={p.id} post={p} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
