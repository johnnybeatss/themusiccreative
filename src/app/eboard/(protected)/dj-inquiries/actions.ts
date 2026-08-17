"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

// Called directly from DjInquiryItem's IntersectionObserver, not a form —
// fires once, the moment an inquiry actually scrolls into view. `.is`
// guard avoids an unnecessary write once it's already read.
export async function markDjInquiryRead(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("dj_inquiries")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark DJ inquiry read:", error.message);
    return;
  }

  // Refreshes the unread badge everywhere it shows (sidebar + dashboard
  // tile), both nested under the (protected) layout.
  revalidatePath("/eboard", "layout");
}

// RLS on dj_inquiries also restricts this to owner/admin (0018) — this
// check just gives a clean no-op instead of relying solely on the
// database to reject it.
export async function deleteDjInquiry(formData: FormData) {
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("dj_inquiries").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete DJ inquiry:", error.message);
  }

  revalidatePath("/eboard/dj-inquiries");
}
