"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/eboard/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border border-steel px-3 py-1.5 text-sm font-medium text-ivory transition-colors hover:border-gold hover:text-gold"
    >
      Sign out
    </button>
  );
}
