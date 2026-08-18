import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import MemberForm from "./MemberForm";
import MemberListItem from "./MemberListItem";

type Member = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  sort_order: number;
};

async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("e_board_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Failed to load team members:", error.message);
    return [];
  }
  return data ?? [];
}

// Owner/admin add/edit/remove entries here — the public /team page just
// reads from the same table read-only. Eboard-tier members can view this
// page (including everyone's Instagram, to connect with each other) but
// can't add/edit/delete (see supabase/migrations/0025_tighten_team_and_reports_write_access.sql).
export default async function TeamAdminPage() {
  const [members, role] = await Promise.all([getMembers(), getEffectiveRole()]);
  const editable = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        TEAM
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        {editable
          ? "Manage what shows up on the public Team page — photos, bios, and display order."
          : "Everyone on E-Board — tap the Instagram icon to connect."}
      </p>

      {editable && <MemberForm />}

      {members.length === 0 ? (
        <p className="mt-6 text-steel-light">No team members yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {members.map((m) => (
            <MemberListItem key={m.id} member={m} editable={editable} />
          ))}
        </div>
      )}
    </div>
  );
}
