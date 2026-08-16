import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";

type DjInquiry = {
  id: string;
  requester_name: string;
  email: string;
  phone: string | null;
  event_date: string | null;
  event_type: string;
  guest_count: string | null;
  budget_range: string | null;
  details: string | null;
  created_at: string;
};

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
          DJ booking inquiries are restricted to owner/admin accounts.
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
        Booking requests from the public /dj-booking page.
      </p>

      {inquiries.length === 0 ? (
        <p className="mt-6 text-steel-light">No inquiries yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {inquiries.map((inq) => (
            <li
              key={inq.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ivory">
                  {inq.requester_name}
                </p>
                <p className="text-xs text-steel-light">
                  {new Date(inq.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-sm text-steel-light">
                {inq.email}
                {inq.phone ? ` · ${inq.phone}` : ""}
              </p>
              <p className="mt-2 text-sm text-ivory">{inq.event_type}</p>
              <p className="mt-1 text-sm text-steel-light">
                {inq.event_date
                  ? new Date(inq.event_date).toLocaleDateString()
                  : "Date TBD"}
                {inq.guest_count ? ` · ~${inq.guest_count} guests` : ""}
                {inq.budget_range ? ` · Budget: ${inq.budget_range}` : ""}
              </p>
              {inq.details && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-steel-light">
                  {inq.details}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
