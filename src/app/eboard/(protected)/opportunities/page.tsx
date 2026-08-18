import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import OpportunityForm from "./OpportunityForm";
import OpportunityListItem from "./OpportunityListItem";

type Opportunity = {
  id: string;
  title: string;
  type: string;
  contact_link: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
};

async function getOpportunities(): Promise<Opportunity[]> {
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

// Same split as the Events admin page: this is the only place opportunities
// get created/edited/deleted. The public /opportunities page reads the same
// table read-only, filtered to postings under 60 days old.
export default async function OpportunitiesAdminPage() {
  const [opportunities, role] = await Promise.all([
    getOpportunities(),
    getEffectiveRole(),
  ]);
  const editable = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        OPPORTUNITIES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        {editable
          ? "Manage what shows up on the public Opportunities page. Postings auto-hide from the public page 60 days after they're added."
          : "What's currently on the public Opportunities page. Adding, editing, and removing is limited to owner/admin accounts."}
      </p>

      {editable && <OpportunityForm />}

      {opportunities.length === 0 ? (
        <p className="mt-6 text-steel-light">No opportunities yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {opportunities.map((o) => (
            <OpportunityListItem
              key={o.id}
              opportunity={o}
              editable={editable}
            />
          ))}
        </div>
      )}
    </div>
  );
}
