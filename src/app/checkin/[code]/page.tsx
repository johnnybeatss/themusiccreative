import type { Metadata } from "next";
import { checkinWindow, getEventByCheckinCode } from "@/lib/checkins";
import { formatEventDateTime } from "@/lib/eventTimezone";
import CheckinForm from "./CheckinForm";

// Private, per-event link — keep it out of search results.
export const metadata: Metadata = {
  title: "Check In",
  robots: { index: false, follow: false },
};

export default async function CheckinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const event = await getEventByCheckinCode(code);

  let notice: string | null = null;
  if (!event) {
    notice = "This check-in link isn't valid. Ask someone on E-Board for the current QR code.";
  } else {
    const { opens, closes } = checkinWindow(event.date);
    const now = Date.now();
    if (now < opens) notice = `Check-in opens closer to the event (${formatEventDateTime(event.date)}).`;
    else if (now > closes) notice = "Check-in for this event has closed.";
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl tracking-wide text-ivory">CHECK IN</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {event && <p className="mt-4 font-semibold text-ivory">{event.name}</p>}
      <div className="mt-6">
        {notice || !event ? (
          <p className="text-steel-light">{notice}</p>
        ) : (
          <CheckinForm code={code} eventName={event.name} />
        )}
      </div>
    </div>
  );
}
