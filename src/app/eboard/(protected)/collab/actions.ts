"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

function revalidate() {
  revalidatePath("/eboard/collab");
  revalidatePath("/collab");
  revalidatePath("/eboard", "layout");
}

// Approving (re)starts the 30-day public window — handy for bumping a post.
export async function setCollabApproved(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  const approve = formData.get("approve") === "1";
  if (!id) return;
  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("collab_posts")
    .update(approve ? { approved_at: now, read_at: now } : { approved_at: null })
    .eq("id", id);
  if (error) console.error("Failed to update collab post:", error.message);
  revalidate();
}

export async function deleteCollabPost(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("collab_posts").delete().eq("id", id);
  if (error) console.error("Failed to delete collab post:", error.message);
  revalidate();
}

export async function markCollabPostRead(id: string) {
  if (!canManage(await getMyRole())) return;
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("collab_posts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) {
    console.error("Failed to mark collab post read:", error.message);
    return;
  }
  revalidatePath("/eboard", "layout");
}
