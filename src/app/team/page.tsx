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
      <h1 className="text-2xl font-bold">Meet the E-Board</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Full roster still being finalized — fills in as members are added
        (Phase 2/6).
      </p>

      {members.length === 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="font-semibold">
              Johnny Sanford — &quot;johnnybeatss&quot;
            </p>
            <p className="text-sm text-neutral-500">President</p>
            <p className="mt-2 text-sm">
              Producer + Visionary. Credits include Sexyy Red, Loe Shimmy,
              Jeremiah, El Snappo, Fattmack, and more. Landed on Apple Music
              charts 4 times.
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <p className="font-semibold">Edward Chirino</p>
            <p className="text-sm text-neutral-500">Vice President</p>
            <p className="mt-2 text-sm">
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
              className="rounded-lg border border-neutral-200 p-4"
            >
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-neutral-500">{m.role}</p>
              {m.bio && <p className="mt-2 text-sm">{m.bio}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold">Founders</h2>
        <div className="mt-3 rounded-lg border border-neutral-200 p-4">
          <p className="font-semibold">Adrian Pedron — &quot;Nugxs&quot;</p>
          <p className="text-sm text-neutral-500">
            Co-Founder (graduated, no longer active)
          </p>
          <p className="mt-2 text-sm">
            Music/vocal production, recording, mixing, mastering.
          </p>
        </div>
      </div>
    </div>
  );
}
