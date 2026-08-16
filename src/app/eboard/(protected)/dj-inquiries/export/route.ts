import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { buildXlsxResponse } from "@/lib/exportXlsx";

export async function GET() {
  const role = await getMyRole();
  if (!canManage(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dj_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []).map((inq) => ({
    "Submitted": new Date(inq.created_at).toLocaleString(),
    "Requester Name": inq.requester_name,
    "Email": inq.email,
    "Phone": inq.phone ?? "",
    "Event Date": inq.event_date ?? "",
    "Event Type / Venue": inq.event_type,
    "Guest Count": inq.guest_count ?? "",
    "Budget Range": inq.budget_range ?? "",
    "Details": inq.details ?? "",
  }));

  return buildXlsxResponse(rows, "dj-inquiries.xlsx");
}
