"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// RLS on `feedback` restricts DELETE to owner/admin (see
// supabase/migrations/0005) — this check just gives eboard-tier users a
// clear no-op instead of a raw RLS error.
export async function deleteFeedback(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete feedback:", error.message);
  }

  revalidatePath("/eboard/feedback");
}

// Called directly from FeedbackItem's IntersectionObserver, not a form —
// fires once, the moment a message actually scrolls into view. `.is` guard
// avoids an unnecessary write once it's already read.
export async function markFeedbackRead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;
  if (!id) return;

  const { error } = await supabase
    .from("feedback")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark feedback read:", error.message);
    return;
  }

  // Refreshes the unread badge everywhere it shows (sidebar + dashboard
  // tile), both nested under the (protected) layout.
  revalidatePath("/eboard", "layout");
}
