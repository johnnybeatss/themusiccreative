"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { generateCheckinCode } from "@/lib/checkins";

// Creates the event's code, or replaces it (old QR stops working) — use
// "regenerate" if a link got posted somewhere public.
export async function generateCode(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const eventId = formData.get("event_id") as string;
  if (!eventId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_checkin_codes")
    .upsert({ event_id: eventId, code: generateCheckinCode(), created_at: new Date().toISOString() });
  if (error) console.error("Failed to generate check-in code:", error.message);
  revalidatePath("/eboard/checkin");
  revalidatePath(`/eboard/checkin/${eventId}`);
}

export async function deleteCheckin(formData: FormData) {
  if (!canManage(await getMyRole())) return;
  const id = formData.get("id") as string;
  const eventId = formData.get("event_id") as string;
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("event_checkins").delete().eq("id", id);
  if (error) console.error("Failed to delete check-in:", error.message);
  revalidatePath(`/eboard/checkin/${eventId}`);
  revalidatePath("/leaderboard");
}
