import { createClient } from "@/lib/supabase/server";
import { getMyRole, canManage } from "@/lib/supabase/role";
import DeleteFeedbackButton from "./DeleteFeedbackButton";

type Feedback = {
  id: string;
  name: string | null;
  category: string;
  message: string;
  created_at: string;
};

const CATEGORY_STYLES: Record<string, string> = {
  "Event idea": "border-gold text-gold",
  Like: "border-ivory/40 text-ivory",
  Dislike: "border-steel text-steel-light",
  General: "border-steel text-steel-light",
};

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
  const [feedback, role] = await Promise.all([getFeedback(), getMyRole()]);
  const canDelete = canManage(role);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        FEEDBACK
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Responses from the public /feedback board — never visible outside
        the E-Board area.
      </p>

      {feedback.length === 0 ? (
        <p className="mt-6 text-steel-light">No responses yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {feedback.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-navy-800 bg-navy-900 p-4 transition-colors hover:border-gold"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                    CATEGORY_STYLES[f.category] ??
                    "border-steel text-steel-light"
                  }`}
                >
                  {f.category}
                </span>
                {canDelete && <DeleteFeedbackButton id={f.id} />}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ivory">
                {f.message}
              </p>
              <p className="mt-2 text-xs text-steel-light">
                {f.name || "Anonymous"} ·{" "}
                {new Date(f.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
