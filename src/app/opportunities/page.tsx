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
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        OPPORTUNITIES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {opportunities.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No opportunities yet — this fills in once the database is
          connected (Phase 2).
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {opportunities.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-lg hover:shadow-gold/10"
            >
              <p className="font-semibold text-ivory">{o.title}</p>
              <p className="text-sm text-steel-light">
                {o.type} · {o.status}
              </p>
              {o.contact_link && (
                <a
                  href={o.contact_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-gold underline"
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
