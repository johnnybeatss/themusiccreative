import type { Metadata } from "next";
import JoinForm from "./JoinForm";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Join The Music Creative @ FIU — a student-led community for producers, artists, DJs, songwriters, and music industry pros.",
  alternates: {
    canonical: "/join",
  },
};

export default function JoinPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        JOIN THE MUSIC CREATIVE
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Fill out the form below and we&apos;ll be in touch. Takes less than
        five minutes.
      </p>

      <JoinForm />
    </div>
  );
}
