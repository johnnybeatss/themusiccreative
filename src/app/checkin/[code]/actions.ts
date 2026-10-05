"use server";

import { createServiceClient } from "@/lib/supabase/serviceClient";
import { checkLengths, isValidEmail } from "@/lib/formGuard";
import { checkinWindow, getEventByCheckinCode, schoolYearStart } from "@/lib/checkins";

// Writes with the service client on purpose — event_checkins has no public
// RLS policies, so this action (which validates the code and the time
// window) is the only way in. Same model as beat battle votes.
//
// No honeypot/min-fill-time here: the form remembers people on their
// device, so a returning member can legitimately submit in under a second.
// The secret code + time window is the guard instead.
export async function checkIn(input: {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  showOnLeaderboard: boolean;
}): Promise<{ error: string | null; total?: number; already?: boolean }> {
  const event = await getEventByCheckinCode(input.code);
  if (!event) return { error: "This check-in link isn't valid." };

  const { opens, closes } = checkinWindow(event.date);
  const now = Date.now();
  if (now < opens) return { error: "Check-in isn't open yet for this event." };
  if (now > closes) return { error: "Check-in for this event has closed." };

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  if (!firstName || !lastName) return { error: "First and last name are required." };
  const tooLong = checkLengths({ "First name": [firstName, 50], "Last name": [lastName, 50] });
  if (tooLong) return { error: tooLong };
  if (email && (!isValidEmail(email) || !email.endsWith("@fiu.edu"))) {
    return { error: "Use your @fiu.edu email, or leave it blank." };
  }

  const identityKey = email || `name:${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
  const service = createServiceClient();
  const { error } = await service.from("event_checkins").insert({
    event_id: event.id,
    first_name: firstName,
    last_name: lastName,
    fiu_email: email || null,
    identity_key: identityKey,
    show_on_leaderboard: input.showOnLeaderboard,
  });
  const already = error?.code === "23505";
  if (error && !already) {
    console.error("Check-in failed:", error.message);
    return { error: "Couldn't check you in — try again." };
  }

  // School-year total for the "that's N events" confirmation.
  const { data: rows } = await service
    .from("event_checkins")
    .select("id, events!inner(date)")
    .eq("identity_key", identityKey)
    .gte("events.date", schoolYearStart().toISOString());
  return { error: null, total: rows?.length ?? 1, already };
}
