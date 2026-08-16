import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "The Music Creative @ FIU's meeting and event calendar — see what's coming up.",
  alternates: {
    canonical: "/calendar",
  },
};

const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=00dbc40f393f0cabac7795e6c71f353439a58158fdb7c122864f7582ce6cdba8%40group.calendar.google.com&ctz=America%2FNew_York";

export default function CalendarPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        CLUB CALENDAR
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <div className="mt-6 overflow-hidden rounded-xl border border-navy-800">
        <iframe
          src={CALENDAR_EMBED_URL}
          style={{ border: 0 }}
          width="100%"
          height="600"
          title="The Music Creative @ FIU calendar"
        />
      </div>
    </div>
  );
}
