// Dev-only utility: generates a magic-link sign-in URL directly via the
// Supabase Admin API, without sending an email. Useful for local testing
// when you've hit the free-tier email rate limit. Uses the service role
// key, so it only ever runs locally — never ship this into the deployed
// app.
//
// Usage:
//   node --env-file=.env.local scripts/dev-login-link.mjs you@email.com
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error(
    "Usage: node --env-file=.env.local scripts/dev-login-link.mjs you@email.com"
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

const { data, error } = await supabase.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: {
    redirectTo: "http://localhost:3000/auth/callback",
  },
});

if (error) {
  console.error("Failed to generate link:", error.message);
  process.exit(1);
}

console.log("\nOpen this URL in your browser to log in:\n");
console.log(data.properties.action_link);
console.log();
