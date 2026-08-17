// All shared docs (Team Deck, Member Intake Form) now live in one shared
// "Music Creative" Drive folder, embedded below via Google's folder
// preview widget — undocumented by Google but stable for over a decade;
// if it ever breaks, the "Open in Google Drive" link is the fallback.
// The folder needs "Anyone with the link — Viewer" sharing for the embed
// to load, same as the individual files needed before.
//
// Member Intake Responses stays link-only and OUT of that folder on
// purpose, per the club's standing rule: that spreadsheet contains PII
// (names, phone numbers, FIU student IDs, emails) and must never be
// fetched or displayed here — not even inside an iframe on this
// E-Board-only page. Link out to it only.

const RESOURCES_FOLDER_ID = "1PhjT86mEep5Vyt87zcP6V3RpaozYwupS";
const INTAKE_RESPONSES_URL =
  "https://docs.google.com/spreadsheets/d/1JZhRDzPwjDsvWDeszr2NpG7vIK-bTPaw8Y8prLQggXg/edit";

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
          Team deck, intake form, and anything else shared with the club —
          all in one place.
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

      <section className="mt-10">
        <h2 className="font-display text-lg tracking-wide text-ivory">
          MEMBER INTAKE RESPONSES
        </h2>
        <p className="mt-2 text-sm text-steel-light">
          Contains member PII (names, phone numbers, FIU student IDs,
          emails) — link only, never embedded or displayed on the site.
        </p>
        <a
          href={INTAKE_RESPONSES_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-gold underline"
        >
          Open in Google Sheets ↗
        </a>
      </section>
    </div>
  );
}
