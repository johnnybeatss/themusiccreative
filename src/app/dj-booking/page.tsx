import type { Metadata } from "next";
import DjBookingForm from "./DjBookingForm";

export const metadata: Metadata = {
  title: "Book a DJ",
  description:
    "Book The Music Creative @ FIU for your next event — DJ sets from a student-run community of producers and performers.",
  alternates: {
    canonical: "/dj-booking",
  },
};

export default function DjBookingPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        BOOK A DJ
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-lg text-sm text-steel-light">
        Looking for a DJ for your event? Tell us the details and we&apos;ll
        follow up with availability and pricing.
      </p>

      <DjBookingForm />
    </div>
  );
}
