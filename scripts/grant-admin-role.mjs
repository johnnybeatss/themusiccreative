// One-off admin utility: promotes existing users to role='admin' in the
// profiles table, by email. Roles are deliberately set by hand (service
// role key, bypasses RLS) rather than from the app — see
// supabase/migrations/0003_roles.sql for why.
//
// Usage:
//   node --env-file=.env.local scripts/grant-admin-role.mjs a@fiu.edu b@fiu.edu
import { createClient } from "@supabase/supabase-js";

const emails = process.argv.slice(2).map((e) => e.toLowerCase());
if (emails.length === 0) {
  console.error(
    "Usage: node --env-file=.env.local scripts/grant-admin-role.mjs email1 email2 ..."
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — make sure .env.local is filled in."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

// Find each auth user by email (paginated listUsers — fine at this scale).
async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < perPage) return null; // exhausted all pages
    page += 1;
  }
}

for (const email of emails) {
  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`✗ ${email} — no auth user found (they need to sign in via /eboard/login at least once first)`);
    continue;
  }

  const { data: before } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (updateError) {
    console.error(`✗ ${email} — update failed: ${updateError.message}`);
    continue;
  }

  console.log(`✓ ${email} (${user.id}) — role: ${before?.role ?? "none"} → admin`);
}
