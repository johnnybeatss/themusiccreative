"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { error: string | null };

const EVENT_TYPES = ["Workshop", "Showcase", "Mixer", "Other"] as const;
const EVENT_STATUSES = ["Not started", "In progress", "Done"] as const;

// RLS on `events` already restricts INSERT/UPDATE/DELETE to authenticated
// users and allows public SELECT (see supabase/migrations/0001_init.sql,
// the "authenticated can write events" policy covers all four operations).
// The auth.getUser() checks below are a friendlier first line of defense
// (clear error message) — RLS is still what actually enforces it.

function parseEventForm(formData: FormData) {
  const name = formData.get("name") as string;
  const date = formData.get("date") as string;
  const location = ((formData.get("location") as string) || "").trim() || null;
  const type = formData.get("type") as string;
  const status = formData.get("status") as string;

  if (!name || !date) {
    return { error: "Name and date are required.", values: null };
  }
  if (!EVENT_TYPES.includes(type as (typeof EVENT_TYPES)[number])) {
    return { error: "Invalid event type.", values: null };
  }
  if (!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
    return { error: "Invalid status.", values: null };
  }

  return {
    error: null,
    values: { name, date, location, type, status },
  } as const;
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to add an event." };
  }

  const { error, values } = parseEventForm(formData);
  if (error || !values) return { error };

  const { error: insertError } = await supabase.from("events").insert(values);
  if (insertError) return { error: insertError.message };

  revalidatePath("/eboard/events");
  revalidatePath("/events");
  return { error: null };
}

export async function updateEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to edit an event." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing event id." };

  const { error, values } = parseEventForm(formData);
  if (error || !values) return { error };

  const { error: updateError } = await supabase
    .from("events")
    .update(values)
    .eq("id", id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/eboard/events");
  revalidatePath("/events");
  return { error: null };
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete event:", error.message);
  }

  revalidatePath("/eboard/events");
  revalidatePath("/events");
}
