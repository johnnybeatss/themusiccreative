import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TeamGrid, { type TeamMember } from "@/components/TeamGrid";

export const metadata: Metadata = {
  title: "Meet The E-Board",
  description:
    "Meet the E-Board running The Music Creative @ FIU — producers, DJs, marketers, and creatives leading the club.",
  alternates: {
    canonical: "/team",
  },
};

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

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/50 bg-navy-900 p-5">
        <div>
          <p className="font-display text-lg tracking-wide text-ivory">
            WANT TO BE PART OF THIS TEAM?
          </p>
          <p className="mt-1 text-sm text-steel-light">
            We&apos;re always looking for people to join E-Board.
          </p>
        </div>
        <a
          href="/join-team"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-light"
        >
          Apply &rarr;
        </a>
      </div>
    </div>
  );
}
