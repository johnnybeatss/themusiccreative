import Link from "next/link";
import { notFound } from "next/navigation";
import { toString as qrToSvg } from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, canManage } from "@/lib/supabase/role";
import { formatEventDateTime } from "@/lib/eventTimezone";
import { checkinUrl } from "@/lib/checkins";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { generateCode, deleteCheckin } from "../actions";

export default async function EventCheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const role = await getEffectiveRole();
  if (!canManage(role)) notFound();

  const supabase = await createClient();
  const [{ data: event }, { data: codeRow }, { data: checkins }] = await Promise.all([
    supabase.from("events").select("id, name, date").eq("id", eventId).maybeSingle(),
    supabase.from("event_checkin_codes").select("code").eq("event_id", eventId).maybeSingle(),
    supabase
      .from("event_checkins")
      .select("id, first_name, last_name, fiu_email, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);
  if (!event) notFound();

  const url = codeRow ? checkinUrl(codeRow.code) : null;
  // White modules on navy would scan poorly on some phones — keep the
  // classic dark-on-white, with a quiet zone (margin) built in.
  const svg = url
    ? await qrToSvg(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#0b1030", light: "#ffffff" } })
    : null;
  const list = checkins ?? [];

  return (
    <div>
      <Link href="/eboard/checkin" className="text-sm text-steel-light hover:text-accent">
        &larr; All events
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-wide text-ivory">{event.name}</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-2 text-sm text-steel-light">{formatEventDateTime(event.date)}</p>

      <div className="mt-6 flex flex-wrap items-start gap-6">
        {svg && url ? (
          <div className="w-full max-w-sm">
            <div
              className="rounded-xl bg-white p-3 [&>svg]:h-auto [&>svg]:w-full"
              // SVG generated server-side by `qrcode` from our own URL — no user input.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-2 break-all text-xs text-steel-light">{url}</p>
          </div>
        ) : (
          <p className="text-steel-light">No check-in QR for this event yet.</p>
        )}
        <form action={generateCode}>
          <input type="hidden" name="event_id" value={event.id} />
          {url ? (
            <ConfirmSubmitButton
              message="Regenerate? The current QR/link will stop working."
              className="text-xs text-steel-light hover:text-accent"
            >
              Regenerate code
            </ConfirmSubmitButton>
          ) : (
            <button type="submit" className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-white hover:bg-gold-light">
              Generate QR
            </button>
          )}
        </form>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-wide text-ivory">
          ATTENDANCE <span className="text-steel-light">({list.length})</span>
        </h2>
        {list.length > 0 && (
          <a
            href={`/eboard/checkin/${event.id}/export`}
            className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-accent hover:bg-gold hover:text-white"
          >
            Export to Excel
          </a>
        )}
      </div>
      {list.length === 0 ? (
        <p className="mt-4 text-steel-light">Nobody checked in yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-navy-800 rounded-xl border border-navy-800 bg-navy-900">
          {list.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span className="text-ivory">
                {c.first_name} {c.last_name}
                <span className="ml-2 text-xs text-steel-light">{c.fiu_email ?? "name only"}</span>
              </span>
              <form action={deleteCheckin}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="event_id" value={event.id} />
                <ConfirmSubmitButton message="Remove this check-in?" className="text-xs text-steel-light hover:text-red-400">
                  Remove
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
