// All shared docs (currently just the Team Deck) live in one shared
// "Music Creative" Drive folder, embedded below via Google's folder
// preview widget — undocumented by Google but stable for over a decade;
// if it ever breaks, the "Open in Google Drive" link is the fallback.
// The folder needs "Anyone with the link — Viewer" sharing for the embed
// to load, same as the individual files needed before.
//
// The old Member Intake Form (Google Forms) has been trashed — /join is
// a native on-site form now, so it was no longer needed. Submissions go
// to Supabase and show up at /eboard/join-submissions instead.
//
// The old Member Intake Responses sheet (historical data from before the
// native /join form) has been moved to a SEPARATE, non-embedded Drive
// folder — deliberately not this one, and no longer linked from this page
// at all. Per the club's standing rule, that spreadsheet contains PII
// (names, phone numbers, FIU student IDs, emails) and must never be
// fetched or displayed here, not even inside an iframe. Find it directly
// in Drive if you need it — it isn't referenced from the site anywhere.

const RESOURCES_FOLDER_ID = "1PhjT86mEep5Vyt87zcP6V3RpaozYwupS";

export default function ResourcesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        DRIVE RESOURCES
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg tracking-wide text-ivory">
            MUSIC CREATIVE FOLDER
          </h2>
          <a
            href={`https://drive.google.com/drive/folders/${RESOURCES_FOLDER_ID}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold underline"
          >
            Open in Google Drive ↗
          </a>
        </div>
        <p className="mt-2 text-sm text-steel-light">
          Team deck and anything else shared with the club — all in one
          place.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-navy-800">
          <iframe
            src={`https://drive.google.com/embeddedfolderview?id=${RESOURCES_FOLDER_ID}#grid`}
            className="h-[500px] w-full bg-white"
            title="Music Creative Drive Folder"
          >
            Loading…
          </iframe>
        </div>
      </section>
    </div>
  );
}
