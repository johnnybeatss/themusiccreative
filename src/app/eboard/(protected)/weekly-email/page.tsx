import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import WeeklyEmailPreview, { type WeeklyEmailDraft } from "./WeeklyEmailPreview";

async function getDrafts(): Promise<WeeklyEmailDraft[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_email_drafts")
    .select("*")
    .order("week_start", { ascending: false });
  if (error) {
    console.error("Failed to load weekly email drafts:", error.message);
    return [];
  }
  return data ?? [];
}

// Same owner/admin-only pattern as Feedback / Join Submissions /
// DJ Inquiries / Team Applications — RLS already blocks eboard-tier reads
// at the database level (see supabase/migrations/0022_weekly_email_drafts.sql).
export default async function WeeklyEmailPage() {
  const role = await getMyRole();

  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          WEEKLY EMAIL
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          The weekly email tool is restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const drafts = await getDrafts();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        WEEKLY EMAIL
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        A draft assembles automatically every Monday morning from that
        week&apos;s upcoming events and is sent to newsletter subscribers —
        but only once you review it below and click Send. Nothing here goes
        out on its own.
      </p>

      {drafts.length === 0 ? (
        <p className="mt-6 text-steel-light">
          No drafts yet — one will appear here after the next Monday-morning
          run, as long as there&apos;s at least one upcoming event.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {drafts.map((d) => (
            <WeeklyEmailPreview key={d.id} draft={d} />
          ))}
        </div>
      )}
    </div>
  );
}
