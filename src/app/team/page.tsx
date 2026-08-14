import { createClient } from "@/lib/supabase/server";

type Member = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

async function getMembers(): Promise<Member[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("e_board_members").select("*");
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
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-gold/10">
            <p className="font-semibold text-ivory">
              Johnny Sanford — &quot;johnnybeatss&quot;
            </p>
            <p className="text-sm text-steel-light">President</p>
            <p className="mt-2 text-sm text-ivory">
              Producer + Visionary. Credits include Sexyy Red, Loe Shimmy,
              Jeremiah, El Snappo, Fattmack, and more. Landed on Apple Music
              charts 4 times.
            </p>
          </div>
          <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-gold/10">
            <p className="font-semibold text-ivory">Edward Chirino</p>
            <p className="text-sm text-steel-light">Vice President</p>
            <p className="mt-2 text-sm text-ivory">
              Creative Director. 1M+ streams across streaming platforms, 6+
              years of professional audio recording experience.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-gold/10"
            >
              <p className="font-semibold text-ivory">{m.name}</p>
              <p className="text-sm text-steel-light">{m.role}</p>
              {m.bio && <p className="mt-2 text-sm text-ivory">{m.bio}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-navy-800 pt-6">
        <h2 className="font-display text-xl tracking-wide text-ivory">
          FOUNDERS
        </h2>
        <div className="mt-3 rounded-xl border border-navy-800 bg-navy-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-gold/10">
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
