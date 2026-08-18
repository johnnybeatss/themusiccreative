import type { Metadata } from "next";
import { Suspense } from "react";
import EboardLoginForm from "./EboardLoginForm";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "E-Board Login";
const DESCRIPTION =
  "Invite-only sign-in for The Music Creative @ FIU's E-Board.";

// The form itself needs useSearchParams (client-only), which is why this
// got split into a server page.tsx just for metadata + a client
// EboardLoginForm.tsx for the actual form — Next doesn't allow exporting
// `metadata` from a "use client" file. This is also what any link-preview
// crawler actually lands on when someone shares "/eboard": unauthenticated
// requests to the protected dashboard redirect here (see
// src/app/eboard/(protected)/layout.tsx), so without this the preview for
// "/eboard" fell back to the generic homepage card too.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/eboard/login",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/eboard/login"),
};

// Invite-only magic-link sign-in. There is no password and no public
// sign-up — an account only works if it was created for that email from
// the Supabase dashboard (Authentication > Users > Invite user).
export default function EboardLoginPage() {
  return (
    <Suspense fallback={null}>
      <EboardLoginForm />
    </Suspense>
  );
}
