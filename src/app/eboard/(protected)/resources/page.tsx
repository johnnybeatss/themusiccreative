// Team Deck + Member Intake Form are embedded directly (both are shared
// publicly in Drive, so Google allows framing them via /embed and
// /viewform?embedded=true).
//
// Member Intake Responses stays link-only on purpose, per the club's
// standing rule: that spreadsheet contains PII (names, phone numbers,
// FIU student IDs, emails) and must never be fetched or displayed here
// — not even inside an iframe on this E-Board-only page. Link out to it
// only.

const TEAM_DECK_ID = "1fQpqyzD9fF9EIarbhKgRsNElcLPJ7x1Zi9iX_xqFNEQ";
const INTAKE_FORM_ID = "1UykWqyXWRb84eL_krCbJlvQpLb3fDOrKj8FrMLvM4G8";
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
            TEAM DECK
          </h2>
          <a
            href={`https://docs.google.com/presentation/d/${TEAM_DECK_ID}/edit`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold underline"
          >
            Open in Google Slides ↗
          </a>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-navy-800">
          <iframe
            src={`https://docs.google.com/presentation/d/${TEAM_DECK_ID}/embed?rm=minimal`}
            className="aspect-video w-full"
            allowFullScreen
            title="Team Deck"
          />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg tracking-wide text-ivory">
            MEMBER INTAKE FORM
          </h2>
          <a
            href={`https://docs.google.com/forms/d/${INTAKE_FORM_ID}/edit`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold underline"
          >
            Open in Google Forms ↗
          </a>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-navy-800">
          <iframe
            src={`https://docs.google.com/forms/d/${INTAKE_FORM_ID}/viewform?embedded=true`}
            className="h-[600px] w-full"
            title="Member Intake Form"
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
