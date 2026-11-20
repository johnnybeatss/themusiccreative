-- 0047: Instagram DM auto-reply bot (src/app/api/instagram/webhook).
--
-- Both tables are server-only: RLS is on with NO policies, so only the
-- service role (src/lib/supabase/serviceClient.ts) can read or write them.
-- Anon/authenticated clients get nothing.

-- One row per DM message the bot has seen or sent. Holds IDs only, never
-- message text (the bot doesn't need it after replying, so it isn't stored).
--   in    = someone DMed the account
--   bot   = the bot replied (rule = which canned reply it sent)
--   human = a team member replied by hand, which pauses the bot for that
--           person (see src/lib/instagram/autoReply.ts)
-- mid is Meta's message ID. Making it the primary key is what drops Meta's
-- duplicate webhook deliveries.
create table instagram_dm_messages (
  mid text primary key,
  ig_user_id text not null,
  direction text not null check (direction in ('in', 'bot', 'human')),
  rule text,
  created_at timestamptz not null default now()
);

create index instagram_dm_messages_user_recent_idx
  on instagram_dm_messages (ig_user_id, created_at desc);

alter table instagram_dm_messages enable row level security;

-- The current long-lived Instagram access token. It expires 60 days after
-- it was issued or last refreshed, so the weekly cron
-- (src/app/api/cron/instagram-token-refresh) keeps it alive and stores the
-- new one here. Single row (id = 1). While this table is empty, the code
-- falls back to the INSTAGRAM_ACCESS_TOKEN env var.
create table instagram_credentials (
  id smallint primary key default 1 check (id = 1),
  access_token text not null,
  expires_at timestamptz,
  refreshed_at timestamptz not null default now()
);

alter table instagram_credentials enable row level security;
