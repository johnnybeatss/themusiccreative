import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Reveal from "@/components/Reveal";
import StatusPill from "@/components/StatusPill";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Gigs, internships, and industry openings shared with members of The Music Creative @ FIU.",
  alternates: {
    canonical: "/opportunities",
  },
};

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
        <div className="mt-6 space-y-4">
          {opportunities.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.05}>
              <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-ivory">{o.title}</p>
                  <StatusPill status={o.status} />
                </div>
                <p className="mt-1 text-sm text-steel-light">{o.type}</p>
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
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
