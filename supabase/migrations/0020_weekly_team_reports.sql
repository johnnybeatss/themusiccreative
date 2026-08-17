-- Retires the old per-person free-text weekly report (week_of /
-- submitted_by / summary / action_items — one row per person per week) in
-- favor of ONE shared report per week that the whole E-board contributes
-- to: upcoming events (pulled live, not stored here), a to-do checklist,
-- a content-ideas checklist, and a leadership notes section.
--
-- Old data isn't dropped, just renamed out of the way so nothing is lost —
-- it no longer shows on the redesigned /eboard/reports page, but it's
-- still queryable directly in Supabase if anyone wants to look back.
alter table weekly_reports rename to weekly_reports_legacy;

create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  created_at timestamptz not null default now(),
  unique (week_start)
);

alter table weekly_reports enable row level security;

create policy "authenticated can read weekly_reports" on weekly_reports
  for select using (auth.role() = 'authenticated');

-- No manual "new report" action — the current week's row is created the
-- first time anyone opens the page (see getOrCreateCurrentReport() in
-- src/app/eboard/(protected)/reports/actions.ts), so any signed-in
-- E-board member needs insert access, not just owner/admin.
create policy "authenticated can insert weekly_reports" on weekly_reports
  for insert with check (auth.role() = 'authenticated');

-- To-do list + content ideas: one table, distinguished by `kind`. Team-wide
-- tool — any signed-in E-board member can add items and check them off.
-- Deleting is the one piece Johnny wanted locked down to owner/admin, so
-- someone can't accidentally (or deliberately) wipe the whole list.
create table weekly_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references weekly_reports(id) on delete cascade,
  kind text not null check (kind in ('todo', 'content_idea')),
  text text not null,
  done boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table weekly_report_items enable row level security;

create policy "authenticated can read weekly_report_items" on weekly_report_items
  for select using (auth.role() = 'authenticated');

create policy "authenticated can insert weekly_report_items" on weekly_report_items
  for insert with check (auth.role() = 'authenticated');

-- Covers checking an item off (toggling `done`) — open to the whole team,
-- same as insert.
create policy "authenticated can update weekly_report_items" on weekly_report_items
  for update using (auth.role() = 'authenticated');

create policy "owner and admin can delete weekly_report_items" on weekly_report_items
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- Notes from Leadership: same owner/admin-only write pattern as
-- leadership_notes (0001/0003), plus an is_priority flag so a note can be
-- flagged and sorted to the top instead of needing a separate section.
create table weekly_report_notes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references weekly_reports(id) on delete cascade,
  body text not null,
  is_priority boolean not null default false,
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table weekly_report_notes enable row level security;

create policy "authenticated can read weekly_report_notes" on weekly_report_notes
  for select using (auth.role() = 'authenticated');

create policy "owner and admin can insert weekly_report_notes" on weekly_report_notes
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can delete weekly_report_notes" on weekly_report_notes
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
