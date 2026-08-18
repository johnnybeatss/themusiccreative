import type { Metadata } from "next";
import JoinTeamForm from "./JoinTeamForm";

export const metadata: Metadata = {
  title: "Join The Team",
  description:
    "Apply to join The Music Creative @ FIU's E-Board/leadership team.",
  alternates: {
    canonical: "/join-team",
  },
};

export default function JoinTeamPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        JOIN THE TEAM
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-lg text-sm text-steel-light">
        Want to help run The Music Creative? We&apos;re always looking for
        people to join E-Board. Tell us a bit about yourself and attach a
        resume — we&apos;ll reach out if it&apos;s a fit.
      </p>

      <JoinTeamForm />
    </div>
  );
}
