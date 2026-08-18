-- Weekly "upcoming events" email. A Vercel Cron job assembles a DRAFT
-- every Monday morning and creates it as a draft Resend Broadcast — it is
-- NEVER auto-sent. That's a deliberate design choice: Johnny's own standing
-- rule (CLAUDE.md) is "review anything member- or public-facing before it
-- goes out, no autopilot sending." An owner/admin reviews the draft on
-- /eboard/weekly-email and clicks Send to actually deliver it to
-- subscribers.
--
-- Same shared-team-inbox read-state model as feedback / join_submissions /
-- dj_inquiries / team_applications: reviewed_at lives on the row itself,
-- not per-user — once any owner/admin has opened the review page, it's
-- reviewed for everyone.

create table weekly_email_drafts (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  week_end date not null,
  resend_broadcast_id text not null,
  subject text not null,
  html text not null,
  event_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent')),
  reviewed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table weekly_email_drafts enable row level security;

-- Deliberately no insert policy. Rows are only ever created by
-- src/app/api/cron/weekly-email-draft/route.ts, which uses the Supabase
-- service role key (bypasses RLS entirely) because there's no logged-in
-- user/session when Vercel's scheduler calls it — same reasoning as
-- scripts/dev-login-link.mjs.
create policy "owner and admin can read weekly_email_drafts" on weekly_email_drafts
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can update weekly_email_drafts" on weekly_email_drafts
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
