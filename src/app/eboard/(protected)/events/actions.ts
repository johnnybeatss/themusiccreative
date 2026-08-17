"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import {
  uploadContentImage,
  uploadContentImages,
} from "@/lib/supabase/uploadContentImage";

export type EventFormState = { error: string | null };

const EVENT_TYPES = ["Workshop", "Showcase", "Mixer", "Other"] as const;
const EVENT_STATUSES = ["Not started", "In progress", "Done"] as const;

// RLS on `events` already restricts INSERT/UPDATE/DELETE to authenticated
// users and allows public SELECT (see supabase/migrations/0001_init.sql,
// the "authenticated can write events" policy covers all four operations).
// The auth.getUser() checks below are a friendlier first line of defense
// (clear error message) — RLS is still what actually enforces it.

// All club events happen at FIU (Miami) — the <input type="datetime-local">
// value has no timezone info at all ("2026-09-21T08:00"), so it has to be
// explicitly anchored to a timezone before it's stored in the `date
// timestamptz` column. Without this, Postgres treats the naive string as
// already being in UTC (its session timezone), silently shifting every
// saved time by 4-5 hours — and because the edit form pre-fills from the
// (already shifted) stored value, re-saving an event without touching the
// time shifts it again. Anchoring to America/New_York here is what fixes
// both the initial shift and the compounding on re-save.
const EVENT_TIMEZONE = "America/New_York";

// Converts a "YYYY-MM-DDTHH:mm" datetime-local value — read as wall-clock
// time in `timeZone` — into a correct UTC ISO timestamp. DST-aware: derives
// the real offset for that specific date from the IANA tz database via
// Intl, rather than hardcoding UTC-4/UTC-5.
function zonedDateTimeToUtcIso(dateTimeLocal: string, timeZone: string): string {
  const [datePart, timePart] = dateTimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);

  // First guess: treat the wall-clock value as if it were already UTC.
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Read that instant back in the target timezone, and correct by however
  // far off the guess was — this is what makes it DST-correct automatically.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(guessUtc));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const tzReading = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24, // some ICU builds format midnight as "24"
    get("minute")
  );

  const offsetMs = tzReading - guessUtc;
  return new Date(guessUtc - offsetMs).toISOString();
}

function parseEventForm(formData: FormData) {
  const name = formData.get("name") as string;
  const rawDate = formData.get("date") as string;
  const location = ((formData.get("location") as string) || "").trim() || null;
  const type = formData.get("type") as string;
  const status = formData.get("status") as string;
  const description =
    ((formData.get("description") as string) || "").trim() || null;
  const guestInstagramUrl =
    ((formData.get("guest_instagram_url") as string) || "").trim() || null;

  if (!name || !rawDate) {
    return { error: "Name and date are required.", values: null };
  }
  if (!EVENT_TYPES.includes(type as (typeof EVENT_TYPES)[number])) {
    return { error: "Invalid event type.", values: null };
  }
  if (!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
    return { error: "Invalid status.", values: null };
  }

  const date = zonedDateTimeToUtcIso(rawDate, EVENT_TIMEZONE);

  return {
    error: null,
    values: {
      name,
      date,
      location,
      type,
      status,
      description,
      guest_instagram_url: guestInstagramUrl,
    },
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
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can add events." };
  }

  const { error, values } = parseEventForm(formData);
  if (error || !values) return { error };

  const image = formData.get("image") as File | null;
  const { url: imageUrl, error: imageError } = await uploadContentImage(
    supabase,
    image
  );
  if (imageError) return { error: imageError };

  const newPhotos = (formData.getAll("photos") as File[]).filter(
    (f) => f && f.size > 0
  );
  const { urls: photoUrls, error: photosError } = await uploadContentImages(
    supabase,
    newPhotos
  );
  if (photosError) return { error: photosError };

  const { error: insertError } = await supabase
    .from("events")
    .insert({ ...values, image_url: imageUrl, photo_urls: photoUrls });
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
  if (!canManage(await getMyRole())) {
    return { error: "Only owner/admin accounts can edit events." };
  }

  const id = formData.get("id") as string;
  if (!id) return { error: "Missing event id." };

  const { error, values } = parseEventForm(formData);
  if (error || !values) return { error };

  // Only touch image_url if a new file was actually chosen — leave the
  // existing cover alone otherwise instead of clearing it.
  const image = formData.get("image") as File | null;
  const { url: imageUrl, error: imageError } = await uploadContentImage(
    supabase,
    image
  );
  if (imageError) return { error: imageError };

  // Gallery photos: the form renders one "keep_photo" checkbox (checked by
  // default) per existing photo, so whatever's still checked on submit is
  // the surviving set — merge that with any newly uploaded files.
  const keptPhotos = formData.getAll("keep_photo") as string[];
  const newPhotos = (formData.getAll("photos") as File[]).filter(
    (f) => f && f.size > 0
  );
  const { urls: newPhotoUrls, error: photosError } = await uploadContentImages(
    supabase,
    newPhotos
  );
  if (photosError) return { error: photosError };
  const photoUrls = [...keptPhotos, ...newPhotoUrls];

  const { error: updateError } = await supabase
    .from("events")
    .update({
      ...values,
      photo_urls: photoUrls,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
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
  if (!canManage(await getMyRole())) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete event:", error.message);
  }

  revalidatePath("/eboard/events");
  revalidatePath("/events");
}
