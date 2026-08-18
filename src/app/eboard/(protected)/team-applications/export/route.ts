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
    .from("team_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // No resume link in the export — signed URLs are short-lived and would
  // be stale by the time someone opens the spreadsheet later. Download
  // resumes individually from the Team Applications page instead.
  const rows = (data ?? []).map((a) => ({
    "Submitted": new Date(a.created_at).toLocaleString(),
    "Full Name": a.full_name,
    "Email": a.email,
    "Phone": a.phone ?? "",
    "Role Interest": a.role_interest,
    "Why Join": a.why_join ?? "",
    "Resume": "On file — download from the Team Applications page",
  }));

  return buildXlsxResponse(rows, "team-applications.xlsx");
}
