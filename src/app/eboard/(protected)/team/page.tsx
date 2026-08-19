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

  // Each member's edit form only shows that one person's order value, so
  // two people can end up with the same number without either admin
  // noticing (e.g. Jayden and Adrian both saved as "2"). Ties still sort
  // deterministically (see getMembers' secondary order by created_at), so
  // nothing breaks — but it's rarely what was intended. Flag every order
  // value used by more than one member so it's visible at a glance in the
  // list, without having to open each edit form to check.
  const orderCounts = new Map<number, number>();
  for (const m of members) {
    orderCounts.set(m.sort_order, (orderCounts.get(m.sort_order) ?? 0) + 1);
  }

  // Default a new member to the end of the list instead of a hardcoded 0 —
  // createMember's auto-shift still makes room correctly if this gets
  // overridden to an occupied number, but landing on "the end" by default
  // means most adds never need the field touched at all.
  const nextOrder =
    members.length > 0
      ? Math.max(...members.map((m) => m.sort_order)) + 1
      : 1;

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

      {editable && <MemberForm nextOrder={nextOrder} />}

      {members.length === 0 ? (
        <p className="mt-6 text-steel-light">No team members yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {members.map((m) => (
            <MemberListItem
              key={m.id}
              member={m}
              editable={editable}
              orderIsDuplicate={(orderCounts.get(m.sort_order) ?? 0) > 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
