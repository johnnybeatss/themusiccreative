import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ReportItem = { id: string; text: string; done: boolean };

export type ReportNote = {
  id: string;
  body: string;
  is_priority: boolean;
  created_at: string;
  author: { display_name: string | null } | null;
};

export type UpcomingEvent = { id: string; name: string; date: string };

export type PastReport = { id: string; week_start: string; week_end: string };

export async function getItems(
  reportId: string,
  kind: "todo" | "content_idea"
): Promise<ReportItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_report_items")
    .select("id, text, done")
    .eq("report_id", reportId)
    .eq("kind", kind)
    .order("created_at", { ascending: true });
  if (error) {
    console.error(`Failed to load ${kind} items:`, error.message);
    return [];
  }
  return data ?? [];
}

export async function getNotes(reportId: string): Promise<ReportNote[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_report_notes")
    .select("id, body, is_priority, created_at, author:profiles(display_name)")
    .eq("report_id", reportId)
    .order("is_priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load notes:", error.message);
    return [];
  }
  return (data as unknown as ReportNote[]) ?? [];
}

// Next 5 upcoming events, pulled live from the Events table you already
// manage — not stored on the report, so it can't go stale.
export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, date")
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(5);
  if (error) {
    console.error("Failed to load upcoming events:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPastReports(excludeId?: string): Promise<PastReport[]> {
  const supabase = await createClient();
  let query = supabase
    .from("weekly_reports")
    .select("id, week_start, week_end")
    .order("week_start", { ascending: false })
    .limit(12);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load past reports:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getReportById(
  id: string
): Promise<{ id: string; week_start: string; week_end: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_reports")
    .select("id, week_start, week_end")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Failed to load report:", error.message);
    return null;
  }
  return data;
}
