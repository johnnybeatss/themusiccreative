import type { Metadata } from "next";

// Same form embedded in the E-Board Resources page — that copy lives
// behind auth for E-Board reference; this is the public-facing entry
// point so prospective members can actually find and submit it.
const INTAKE_FORM_ID = "1UykWqyXWRb84eL_krCbJlvQpLb3fDOrKj8FrMLvM4G8";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Join The Music Creative @ FIU — a student-led community for producers, artists, DJs, songwriters, and music industry pros.",
};

export default function JoinPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        JOIN THE MUSIC CREATIVE
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Fill out the intake form below and we&apos;ll be in touch. Takes less
        than five minutes.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-navy-800">
        <iframe
          src={`https://docs.google.com/forms/d/${INTAKE_FORM_ID}/viewform?embedded=true`}
          className="h-[900px] w-full"
          title="Member Intake Form"
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
}
