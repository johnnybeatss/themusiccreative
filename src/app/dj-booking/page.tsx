import type { Metadata } from "next";
import DjBookingForm from "./DjBookingForm";
import CharmScatter from "@/components/CharmScatter";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "DJ Sign-Up";
const DESCRIPTION =
  "Sign up to DJ for The Music Creative @ FIU — join the roster we call on for future club events.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/dj-booking",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/dj-booking"),
};

export default function DjBookingPage() {
  return (
    <div className="relative">
      <CharmScatter
        items={[
          { name: "cd", className: "right-[3%] top-0 w-14 rotate-12" },
          { name: "star", className: "left-[3%] bottom-0 w-12 -rotate-12" },
        ]}
      />
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        DJ SIGN-UP
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-lg text-sm text-steel-light">
        Want to DJ one of our events? Fill this out and we&apos;ll reach out
        when we&apos;re booking a DJ that&apos;s a fit.
      </p>

      <DjBookingForm />
    </div>
  );
}
