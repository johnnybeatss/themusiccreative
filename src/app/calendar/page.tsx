import type { Metadata } from "next";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Calendar";
const DESCRIPTION =
  "The Music Creative @ FIU's meeting and event calendar — see what's coming up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/calendar",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/calendar"),
};

// Params beyond src/ctz all come from Google's own "Customize" panel
// (Calendar Settings → this calendar → Integrate calendar), not guesswork:
// mode fixes the view, and the show* flags strip out Google's own title
// bar, print icon, and timezone picker — redundant next to our own H1 and
// ctz, and it trims some of the embed's default whitespace/chrome.
const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=00dbc40f393f0cabac7795e6c71f353439a58158fdb7c122864f7582ce6cdba8%40group.calendar.google.com&ctz=America%2FNew_York&mode=MONTH&showTitle=0&showPrint=0&showTz=0&showCalendars=0";

export default function CalendarPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        CLUB CALENDAR
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />

      {/* Google renders the day grid itself, in a fixed white/light
          theme — there's no embed parameter or CSS that can recolor it
          from our side, that's a real platform limit, not something
          skipped here. What IS themed is everything around it: the gold
          top border, header bar, and card treatment, so it reads as an
          intentional light panel inset into the page rather than a
          foreign block. */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gold/40 bg-navy-900 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="border-b border-navy-800 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
            Meetings &amp; Events
          </p>
        </div>
        <iframe
          src={CALENDAR_EMBED_URL}
          style={{ border: 0 }}
          width="100%"
          height="600"
          title="The Music Creative @ FIU calendar"
        />
      </div>
      <p className="mt-3 text-xs text-steel-light">
        The calendar grid itself is rendered by Google and keeps its own
        colors — only the frame around it is themed.
      </p>
    </div>
  );
}
