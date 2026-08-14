const CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=00dbc40f393f0cabac7795e6c71f353439a58158fdb7c122864f7582ce6cdba8%40group.calendar.google.com&ctz=America%2FNew_York";

export default function EboardCalendarPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        MEETING CALENDAR
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Same calendar as the public page. To edit events, use Google
        Calendar directly — edit access is granted there (Settings → Share
        with specific people → &quot;Make changes to events&quot;), not
        through this site.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-navy-800">
        <iframe
          src={CALENDAR_EMBED_URL}
          style={{ border: 0 }}
          width="100%"
          height="600"
          title="The Music Creative @ FIU calendar"
        />
      </div>
      <a
        href="https://calendar.google.com/calendar/r"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm text-gold underline"
      >
        Open Google Calendar ↗
      </a>
    </div>
  );
}
