import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { buildXlsxResponse } from "@/lib/exportXlsx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getMyRole();
  if (!canManage(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: event }, { data, error }] = await Promise.all([
    supabase.from("events").select("name").eq("id", id).maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []).map((r) => ({
    "Submitted": new Date(r.created_at).toLocaleString(),
    "Name": r.name,
    "Email": r.email,
    "Bringing": r.guest_count ?? "",
    "Notes": r.notes ?? "",
  }));

  const filename = event?.name
    ? `${event.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-rsvps.xlsx`
    : "event-rsvps.xlsx";

  return buildXlsxResponse(rows, filename);
}
