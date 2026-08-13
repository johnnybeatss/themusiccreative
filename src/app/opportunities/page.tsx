import { createClient } from "@/lib/supabase/server";

type Opportunity = {
  id: string;
  title: string;
  type: string;
  contact_link: string | null;
  status: string;
};

async function getOpportunities(): Promise<Opportunity[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load opportunities:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();

  return (
    <div>
      <h1 className="text-2xl font-bold">Opportunities</h1>
      {opportunities.length === 0 ? (
        <p className="mt-4 text-neutral-500">
          No opportunities yet — this fills in once the database is
          connected (Phase 2).
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {opportunities.map((o) => (
            <li key={o.id} className="rounded-lg border border-neutral-200 p-4">
              <p className="font-semibold">{o.title}</p>
              <p className="text-sm text-neutral-500">
                {o.type} · {o.status}
              </p>
              {o.contact_link && (
                <a
                  href={o.contact_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm underline"
                >
                  {o.contact_link}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
