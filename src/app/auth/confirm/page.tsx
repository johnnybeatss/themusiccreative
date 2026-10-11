import type { Metadata } from "next";
import { confirmSignIn } from "./actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

// Landing page for the sign-in email link. The link itself does nothing
// until you press the button: email security scanners (Gmail, Outlook Safe
// Links, school mail filters) "pre-open" links to check them, and with a
// one-click link that pre-open used up the sign-in before you ever clicked.
// Scanners don't press buttons, so the real sign-in only happens here.
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const { token_hash = "", type = "email", next = "/eboard" } = await searchParams;

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-display text-2xl tracking-wide text-ivory">E-BOARD SIGN IN</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      {token_hash ? (
        <form action={confirmSignIn} className="mt-6">
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full rounded-lg bg-gold px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-light"
          >
            Continue to E-Board
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-steel-light">
          This sign-in link is incomplete.{" "}
          <a href="/eboard/login" className="text-accent hover:underline">
            Request a new one
          </a>
          .
        </p>
      )}
    </div>
  );
}
