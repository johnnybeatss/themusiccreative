import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import { buildXlsxResponse } from "@/lib/exportXlsx";

// Route Handlers aren't wrapped by the (protected) layout's auth check the
// way page.tsx renders are, so this re-checks owner/admin itself — same
// role gate as the page, just enforced independently here too.
export async function GET() {
  const role = await getMyRole();
  if (!canManage(role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("join_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = (data ?? []).map((s) => ({
    "Submitted": new Date(s.created_at).toLocaleString(),
    "Full Name": s.full_name,
    "FIU Email": s.fiu_email,
    "Student ID": s.student_id,
    "Phone": s.phone,
    "Major": s.major,
    "Year": s.year,
    "Creative Roles": (s.creative_roles ?? []).join(", "),
    "Other Role": s.creative_role_other ?? "",
    "Experience Length": s.experience_length,
    "Achievements": s.achievements ?? "",
    "Portfolio Link": s.portfolio_link,
    "Club Goals": s.club_goals,
    "Wants Collab": s.wants_collab,
    "Wants To Perform": s.wants_to_perform,
    "Signed To Label": s.signed_to_label,
    "Workshop Ideas": s.workshop_ideas ?? "",
  }));

  return buildXlsxResponse(rows, "join-submissions.xlsx");
}
