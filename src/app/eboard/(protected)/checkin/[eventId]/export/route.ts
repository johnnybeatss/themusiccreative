import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { buildXlsxResponse } from "@/lib/exportXlsx";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  if (!canManage(await getMyRole())) return new Response("Forbidden", { status: 403 });
  const { eventId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_checkins")
    .select("first_name, last_name, fiu_email, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []).map((c) => ({
    "Checked In": new Date(c.created_at).toLocaleString("en-US", { timeZone: "America/New_York" }),
    "First Name": c.first_name,
    "Last Name": c.last_name,
    "FIU Email": c.fiu_email ?? "",
  }));
  return buildXlsxResponse(rows, "event-checkins.xlsx");
}
