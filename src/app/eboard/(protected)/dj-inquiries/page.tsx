import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import DjInquiryItem, { type DjInquiry } from "./DjInquiryItem";

async function getInquiries(): Promise<DjInquiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dj_inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load DJ inquiries:", error.message);
    return [];
  }
  return data ?? [];
}

// Same owner/admin-only pattern as Feedback and Join Submissions.
export default async function DjInquiriesPage() {
  const role = await getMyRole();

  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          DJ INQUIRIES
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          DJ sign-ups are restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const inquiries = await getInquiries();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-ivory">
            DJ INQUIRIES
          </h1>
          <div className="mt-2 h-1 w-16 bg-gold" />
        </div>
        {inquiries.length > 0 && (
          <a
            href="/eboard/dj-inquiries/export"
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-navy-950"
          >
            Export to Excel
          </a>
        )}
      </div>
      <p className="mt-4 text-sm text-steel-light">
        DJs who signed up through the public /dj-booking page to be
        considered for future club events. New ones are marked read as you
        scroll past them.
      </p>

      {inquiries.length === 0 ? (
        <p className="mt-6 text-steel-light">No inquiries yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {inquiries.map((inq) => (
            <DjInquiryItem key={inq.id} inquiry={inq} />
          ))}
        </ul>
      )}
    </div>
  );
}
