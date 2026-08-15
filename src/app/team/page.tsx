import { createClient } from "@/lib/supabase/server";
import TeamGrid, { type TeamMember } from "@/components/TeamGrid";

type Member = TeamMember;

async function getMembers(): Promise<Member[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("e_board_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("Failed to load e-board members:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function TeamPage() {
  const members = await getMembers();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        MEET THE E-BOARD
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Full roster still being finalized — fills in as members are added
        (Phase 2/6).
      </p>

      {members.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No E-Board members added yet — fills in as members are added from
          the E-Board area.
        </p>
      ) : (
        <div className="mt-6">
          <TeamGrid members={members} />
        </div>
      )}

      <div className="mt-10 border-t border-navy-800 pt-6">
        <h2 className="font-display text-xl tracking-wide text-ivory">
          FOUNDERS
        </h2>
        <div className="mt-3 rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
          <p className="font-semibold text-ivory">
            Adrian Pedron — &quot;Nugxs&quot;
          </p>
          <p className="text-sm text-steel-light">
            Co-Founder (graduated, no longer active)
          </p>
          <p className="mt-2 text-sm text-ivory">
            Music/vocal production, recording, mixing, mastering.
          </p>
        </div>
      </div>
    </div>
  );
}
