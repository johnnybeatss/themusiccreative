import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { crownEntry, pickTopEntry } from "@/lib/crownBattle";

// Saturday auto-crown (vercel.json). Each scheduled Spotlight Battle closes
// Fri 11:59 PM ET (supabase/migrations/0040_vote_all_week.sql); this picks
// the entry with the most votes (tie -> earliest submission) and makes it the
// site-wide spotlight. Runs Sat 06:00 UTC = 1-2 AM ET, after the database
// closes the battle at midnight ET in both EST and EDT. Oldest first, so a
// missed run catches up and the newest winner ends up live. Zero votes ->
// current spotlight stays. Same CRON_SECRET lock as the weekly email cron.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  // Monday of the current week in Eastern time, as YYYY-MM-DD.
  const easternToday = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const d = new Date(`${easternToday}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const thisWeek = d.toISOString().slice(0, 10);

  // Closed scheduled battles from this week or the last two, no winner yet.
  // (The 2-week floor stops zero-vote battles from being rechecked forever.)
  const floor = new Date(`${thisWeek}T12:00:00Z`);
  floor.setUTCDate(floor.getUTCDate() - 14);
  const { data: battles, error } = await supabase
    .from("beat_battles")
    .select("id, title")
    .not("week_start", "is", null)
    .lte("week_start", thisWeek)
    .gte("week_start", floor.toISOString().slice(0, 10))
    .is("winner_entry_id", null)
    .eq("status", "closed")
    .order("week_start", { ascending: true });
  if (error) {
    console.error("crown-battle: query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { battle: string; winner: string | null; error?: string }[] = [];
  for (const b of battles ?? []) {
    const entryId = await pickTopEntry(supabase, b.id);
    if (!entryId) {
      await supabase.from("beat_battles").update({ status: "closed" }).eq("id", b.id);
      results.push({ battle: b.title, winner: null });
      continue;
    }
    const err = await crownEntry(supabase, b.id, entryId);
    if (err) console.error(`crown-battle: ${b.title}:`, err);
    results.push({ battle: b.title, winner: err ? null : entryId, ...(err ? { error: err } : {}) });
  }

  if (results.length) {
    revalidatePath("/", "layout");
    revalidatePath("/battles");
  }
  return NextResponse.json({ ok: true, results });
}
