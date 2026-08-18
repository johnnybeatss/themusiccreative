"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadContentImage } from "@/lib/supabase/uploadContentImage";
import { getMyRole, canManage } from "@/lib/supabase/role";

export type MemberFormState = { error: string | null };

const PHOTO_BUCKET = "eboard-photos";

// Owner/admin only — eboard-tier members can view the Team hub but not
// add/edit/delete entries (see supabase/migrations/0025_tighten_team_and_reports_write_access.sql).
// The canManage() checks below give a clean error/no-op instead of a raw
// RLS error reaching the client — RLS is still what actually enforces it.

function parseMemberForm(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  const role = ((formData.get("role") as string) || "").trim();
  const bio = ((formData.get("bio") as string) || "").trim() || null;
  const instagramUrl =
    ((formData.get("instagram_url") as string) || "").trim() || null;
  const linkedinUrl =
    ((formData.get("linkedin_url") as string) || "").trim() || null;
  const sortOrderRaw = formData.get("sort_order") as string;
  const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : 0;

  if (!name || !role) {
    return { error: "Name and role are required.", values: null };
  }
  if (Number.isNaN(sortOrder)) {
    return { error: "Order must be a number.", values: null };
  }

  return {
    error: null,
    values: {
      name,
      role,
      bio,
      instagram_url: instagramUrl,
      linkedin_url: linkedinUrl,
      sort_order: sortOrder,
    },
  } as const;
}

export async function createMember(
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to add a team member." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add team members." };
  }

  const { error, values } = parseMemberForm(formData);
  if (error || !values) return { error };

  const photo = formData.get("photo") as File | null;
  const { url: photoUrl, error: photoError } = await uploadContentImage(
    supabase,
    photo,
    PHOTO_BUCKET
  );
  if (photoError) return { error: photoError };

  const { error: insertError } = await supabase
    .from("e_board_members")
    .insert({ ...values, photo_url: photoUrl });
  if (insertError) return { error: insertError.message };

  revalidatePath("/eboard/team");
  revalidatePath("/team");
  return { error: null };
}

export async function updateMember(
  _prevState: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to edit a team member." };
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can edit team members." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing member id." };

  const { error, values } = parseMemberForm(formData);
  if (error || !values) return { error };

  // Only touch photo_url if a new file was actually chosen — leave the
  // existing headshot alone otherwise instead of clearing it.
  const photo = formData.get("photo") as File | null;
  const { url: photoUrl, error: photoError } = await uploadContentImage(
    supabase,
    photo,
    PHOTO_BUCKET
  );
  if (photoError) return { error: photoError };

  const { error: updateError } = await supabase
    .from("e_board_members")
    .update({ ...values, ...(photoUrl ? { photo_url: photoUrl } : {}) })
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/eboard/team");
  revalidatePath("/team");
  return { error: null };
}

export async function deleteMember(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase
    .from("e_board_members")
    .delete()
    .eq("id", id);
  if (error) console.error("Failed to delete team member:", error.message);

  revalidatePath("/eboard/team");
  revalidatePath("/team");
}
