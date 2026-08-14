"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NoteFormState = { error: string | null };

// RLS on leadership_notes already restricts INSERT/UPDATE to authenticated
// users (see supabase/migrations/0001_init.sql). There's no DELETE policy
// in that migration, so deleteNote will fail closed until one is added —
// flagged in the delete handler below rather than silently no-op-ing.
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
