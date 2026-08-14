"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

export type NoteFormState = { error: string | null };

// RLS on leadership_notes restricts INSERT/UPDATE/DELETE to owner/admin
// (see supabase/migrations/0003_roles.sql) — that's the real enforcement.
// The role checks below just give eboard-tier users a clear message
// instead of a confusing raw RLS error.
export async function createNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to add a note." };
  }
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add notes." };
  }

  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  if (!title) {
    return { error: "Title is required." };
  }

  const { error } = await supabase.from("leadership_notes").insert({
    title,
    body: body || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/eboard/notes");
  return { error: null };
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase
    .from("leadership_notes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete note:", error.message);
  }

  revalidatePath("/eboard/notes");
}
