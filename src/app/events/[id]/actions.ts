"use server";

import { createClient } from "@/lib/supabase/server";
import { looksLikeSpam, isValidEmail, checkLengths } from "@/lib/formGuard";
import { isEventPast } from "@/lib/eventTimezone";

export type RsvpFormState = { error: string | null };

// Public insert only — RLS on event_rsvps (0015) allows anyone to submit
// but restricts reads to owner/admin accounts. No auth check needed here.
export async function submitRsvp(
  _prevState: RsvpFormState,
  formData: FormData
): Promise<RsvpFormState> {
  // Bots get a fake success and nothing is saved (src/lib/formGuard.ts).
  if (looksLikeSpam(formData)) return { error: null };

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

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  const tooLong = checkLengths({ Name: [name, 120], "Guest count": [guestCount, 60], Notes: [notes, 1000] });
  if (tooLong) return { error: tooLong };

  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("date")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: "That event doesn't exist." };
  if (isEventPast(event.date)) return { error: "This event already happened." };

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
