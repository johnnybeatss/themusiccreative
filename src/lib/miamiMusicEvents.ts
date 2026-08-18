// "What's happening" — Miami-area music industry events, pulled live from
// Ticketmaster's Discovery API (a real public API, not a scraper). Requires
// TICKETMASTER_API_KEY; returns [] rather than throwing if it's missing or
// the request fails, so callers can render nothing instead of breaking the
// page/email. Originally lived inline in src/app/opportunities/page.tsx
// (monthly window, 6 results) — extracted so the weekly email cron route
// can reuse the same fetch with a shorter window and a smaller cap.

type TicketmasterEvent = {
  id: string;
  name: string;
  url: string;
  dates: { start: { dateTime?: string; localDate: string } };
  images?: { url: string; width: number }[];
  _embedded?: { venues?: { name: string }[] };
};

type TicketmasterResponse = {
  _embedded?: { events?: TicketmasterEvent[] };
};

export type MiamiMusicEvent = {
  id: string;
  name: string;
  date: string;
  url: string;
  imageUrl: string | null;
  venue: string | null;
};

export async function getMiamiMusicEvents({
  startDate,
  endDate,
  limit,
}: {
  startDate: Date;
  endDate: Date;
  limit: number;
}): Promise<MiamiMusicEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];

  const toTmDateTime = (d: Date) => d.toISOString().split(".")[0] + "Z";

  const params = new URLSearchParams({
    apikey: apiKey,
    city: "Miami",
    stateCode: "FL",
    classificationName: "music",
    startDateTime: toTmDateTime(startDate),
    endDateTime: toTmDateTime(endDate),
    sort: "date,asc",
    size: String(limit),
  });

  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { next: { revalidate: 21600 } } // 6 hours
    );
    if (!res.ok) {
      console.error("Ticketmaster API error:", res.status, res.statusText);
      return [];
    }
    const data = (await res.json()) as TicketmasterResponse;
    const events = data._embedded?.events ?? [];
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.dates.start.dateTime ?? e.dates.start.localDate,
      url: e.url,
      imageUrl:
        e.images?.find((img) => img.width >= 640)?.url ??
        e.images?.[0]?.url ??
        null,
      venue: e._embedded?.venues?.[0]?.name ?? null,
    }));
  } catch (err) {
    console.error("Failed to fetch Ticketmaster events:", err);
    return [];
  }
}
