import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EboardNav from "@/components/EboardNav";
import SessionGuard from "@/components/SessionGuard";

// Wraps every /eboard/* route EXCEPT /eboard/login (which lives outside
// this (protected) route group, so it's never gated). This split fixes an
// infinite-redirect bug: gating /eboard/login too meant an unauthenticated
// visit redirected to /eboard/login, which re-ran this same check, which
// redirected again, forever.
export default async function EboardProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <div className="rounded-xl border border-gold/40 bg-navy-900 p-6">
        <p className="font-semibold text-ivory">
          E-Board area not wired up yet.
        </p>
        <p className="mt-2 text-sm text-steel-light">
          This section needs a Supabase project + auth (Phase 2/4) before
          it&apos;s reachable. The structure is in place, just not
          connected.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  // Always re-verify server-side with getUser() — don't rely on proxy.ts
  // alone, per Supabase's own guidance (it can be misconfigured/bypassed).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/eboard/login");
  }

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
      <Suspense fallback={null}>
        <SessionGuard />
      </Suspense>
      <EboardNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
