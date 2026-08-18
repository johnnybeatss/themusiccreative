"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getMyRole, isOwner } from "@/lib/supabase/role";

const DEMO_VIEW_COOKIE = "eboard_demo_view";
// Auto-expires so a demo left open in a browser tab doesn't quietly stay
// in "view as E-Board" mode for days.
const MAX_AGE_SECONDS = 60 * 60 * 4;

// Owner-only, on purpose (Johnny's call — not admin). Re-checks the real
// role itself rather than trusting the caller, since this is the one place
// that decides whether the cookie can be set at all.
export async function enterDemoView() {
  const role = await getMyRole();
  if (!isOwner(role)) return;

  const cookieStore = await cookies();
  cookieStore.set(DEMO_VIEW_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
  });
  revalidatePath("/eboard", "layout");
}

export async function exitDemoView() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_VIEW_COOKIE);
  revalidatePath("/eboard", "layout");
}
