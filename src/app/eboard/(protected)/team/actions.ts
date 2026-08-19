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

type Client = Awaited<ReturnType<typeof createClient>>;

// e_board_members has no unique constraint on sort_order — two members can
// end up sharing a value if each is edited independently without seeing
// the other's number (see MemberListItem's duplicate-order badge). Rather
// than just flagging that after the fact, create/update/delete all call
// this to renumber the rows around whatever changed, so a collision can't
// happen in the first place: adding a member shifts everyone at/after the
// new spot down the list by one, moving a member shifts everyone between
// its old and new spot, and deleting one closes the gap it leaves behind.
async function shiftSortOrders(
  supabase: Client,
  range: { gte?: number; gt?: number; lt?: number; lte?: number },
  delta: number,
  excludeId?: string
): Promise<string | null> {
  let query = supabase.from("e_board_members").select("id, sort_order");
  if (range.gte !== undefined) query = query.gte("sort_order", range.gte);
  if (range.gt !== undefined) query = query.gt("sort_order", range.gt);
  if (range.lt !== undefined) query = query.lt("sort_order", range.lt);
  if (range.lte !== undefined) query = query.lte("sort_order", range.lte);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) return error.message;

  for (const row of data ?? []) {
    const { error: updateError } = await supabase
      .from("e_board_members")
      .update({ sort_order: row.sort_order + delta })
      .eq("id", row.id);
    if (updateError) return updateError.message;
  }
  return null;
}

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

  // Make room at the requested spot before inserting, so the new member
  // never lands on a number someone else already has.
  const shiftError = await shiftSortOrders(
    supabase,
    { gte: values.sort_order },
    1
  );
  if (shiftError) return { error: shiftError };

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

  // Moving a member to a new spot shifts everyone strictly between its old
  // and new position by one, the same way reordering a list normally
  // works — so retyping someone else's number just swaps places instead of
  // creating a duplicate.
  const { data: existing, error: existingError } = await supabase
    .from("e_board_members")
    .select("sort_order")
    .eq("id", id)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existing && existing.sort_order !== values.sort_order) {
    const oldOrder = existing.sort_order;
    const newOrder = values.sort_order;
    const shiftError =
      newOrder > oldOrder
        ? await shiftSortOrders(
            supabase,
            { gt: oldOrder, lte: newOrder },
            -1,
            id
          )
        : await shiftSortOrders(
            supabase,
            { gte: newOrder, lt: oldOrder },
            1,
            id
          );
    if (shiftError) return { error: shiftError };
  }

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

  // Grab the position being removed so the gap it leaves behind can be
  // closed — otherwise the numbers get sparser with every delete.
  const { data: existing } = await supabase
    .from("e_board_members")
    .select("sort_order")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("e_board_members")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Failed to delete team member:", error.message);
    return;
  }

  if (existing) {
    const shiftError = await shiftSortOrders(
      supabase,
      { gt: existing.sort_order },
      -1
    );
    if (shiftError) {
      console.error("Failed to close order gap after delete:", shiftError);
    }
  }

  revalidatePath("/eboard/team");
  revalidatePath("/team");
}
