import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Safe to call from Client Components —
// only the public URL and anon key are ever exposed here.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
