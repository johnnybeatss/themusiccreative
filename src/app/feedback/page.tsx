import type { Metadata } from "next";
import FeedbackForm from "./FeedbackForm";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Share ideas, likes, and dislikes with The Music Creative @ FIU E-Board — help shape what the club does next.",
  alternates: {
    canonical: "/feedback",
  },
};

export default function FeedbackPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        FEEDBACK
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-lg text-sm text-steel-light">
        Tell us what events you want to see, what&apos;s working, and
        what&apos;s not. This goes straight to the E-Board — it&apos;s never
        posted publicly.
      </p>
      <FeedbackForm />
    </div>
  );
}
