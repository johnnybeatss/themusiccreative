"use server";

import { createClient } from "@/lib/supabase/server";

export type DjBookingFormState = { error: string | null };

function req(formData: FormData, key: string): string {
  return ((formData.get(key) as string) || "").trim();
}

// Public, unauthenticated action — same trust model as /feedback and
// /join. RLS (supabase/migrations/0014_join_and_dj_inquiries.sql) allows
// the insert but has no public select policy.
export async function submitDjBooking(
  _prevState: DjBookingFormState,
  formData: FormData
): Promise<DjBookingFormState> {
  const requesterName = req(formData, "requester_name");
  const email = req(formData, "email");
  const phone = req(formData, "phone") || null;
  const eventDate = req(formData, "event_date") || null;
  const eventType = req(formData, "event_type");
  const guestCount = req(formData, "guest_count") || null;
  const budgetRange = req(formData, "budget_range") || null;
  const details = req(formData, "details") || null;

  if (!requesterName || !email || !eventType) {
    return {
      error: "Name, email, and event type are required.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dj_inquiries").insert({
    requester_name: requesterName,
    email,
    phone,
    event_date: eventDate,
    event_type: eventType,
    guest_count: guestCount,
    budget_range: budgetRange,
    details,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
