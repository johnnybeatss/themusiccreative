import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import FeedbackItem, { type Feedback } from "./FeedbackItem";

async function getFeedback(): Promise<Feedback[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load feedback:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function FeedbackHubPage() {
  const role = await getMyRole();

  // RLS already blocks eboard-tier reads at the database level (see
  // supabase/migrations/0011_feedback_admin_only.sql) — this just gives
  // them a clear message instead of a silently empty list.
  if (!canManage(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          FEEDBACK
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          Feedback responses are restricted to owner/admin accounts.
        </p>
      </div>
    );
  }

  const feedback = await getFeedback();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        FEEDBACK
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Responses from the public /feedback board — never visible outside
        the E-Board area. New ones are marked read as you scroll past them.
      </p>

      {feedback.length === 0 ? (
        <p className="mt-6 text-steel-light">No responses yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {feedback.map((f) => (
            <FeedbackItem key={f.id} feedback={f} />
          ))}
        </ul>
      )}
    </div>
  );
}
