"use server";

import { createClient } from "@/lib/supabase/server";

export type RsvpFormState = { error: string | null };

// Public insert only — RLS on event_rsvps (0015) allows anyone to submit
// but restricts reads to owner/admin accounts. No auth check needed here.
export async function submitRsvp(
  _prevState: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  const eventId = formData.get("event_id") as string;
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const guestCount =
    ((formData.get("guest_count") as string) || "").trim() || null;
  const notes = ((formData.get("notes") as string) || "").trim() || null;

  if (!eventId) return { error: "Missing event." };
  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("event_rsvps").insert({
    event_id: eventId,
    name,
    email,
    guest_count: guestCount,
    notes,
  });
  if (error) return { error: error.message };

  return { error: null };
}
