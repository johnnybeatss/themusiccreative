"use server";

import { createClient } from "@/lib/supabase/server";
import { looksLikeSpam, isValidEmail, checkLengths } from "@/lib/formGuard";

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
  // Bots get a fake success and nothing is saved (src/lib/formGuard.ts).
  if (looksLikeSpam(formData)) return { error: null };

  const requesterName = req(formData, "requester_name");
  const email = req(formData, "email");
  const phone = req(formData, "phone") || null;
  const eventDate = req(formData, "event_date") || null;
  const eventType = req(formData, "event_type");
  const guestCount = req(formData, "guest_count") || null;
  const budgetRange = req(formData, "budget_range") || null;
  const portfolioLink = req(formData, "portfolio_link");
  const experience = req(formData, "experience");
  const details = req(formData, "details") || null;

  if (
    !requesterName ||
    !email ||
    !eventType ||
    !portfolioLink ||
    !experience
  ) {
    return {
      error:
        "Name, email, event type, portfolio link, and experience are required.",
    };
  }

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  const tooLong = checkLengths({ Name: [requesterName, 120], Phone: [phone, 40], "Portfolio link": [portfolioLink, 500], Details: [details, 2000] });
  if (tooLong) return { error: tooLong };

  const supabase = await createClient();
  const { error } = await supabase.from("dj_inquiries").insert({
    requester_name: requesterName,
    email,
    phone,
    event_date: eventDate,
    event_type: eventType,
    guest_count: guestCount,
    budget_range: budgetRange,
    portfolio_link: portfolioLink,
    experience,
    details,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
