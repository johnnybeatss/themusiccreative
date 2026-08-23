import type { Metadata } from "next";
import JoinTeamForm from "./JoinTeamForm";
import CharmScatter from "@/components/CharmScatter";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Join The Team";
const DESCRIPTION =
  "Apply to join The Music Creative @ FIU's E-Board/leadership team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/join-team",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/join-team"),
};

export default function JoinTeamPage() {
  return (
    <div className="relative">
      <CharmScatter
        items={[
          { name: "speaker", className: "right-[3%] top-0 w-14 rotate-6" },
          {
            name: "headphones",
            className: "left-[2%] bottom-0 w-16 -rotate-12",
          },
        ]}
      />
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
