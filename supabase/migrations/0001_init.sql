-- The Music Creative @ FIU — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`) once the project
-- exists (Phase 2). Matches the data model + access control in the website
-- plan (Sections 3-4).

create type event_type as enum ('Workshop', 'Showcase', 'Mixer', 'Other');
create type opportunity_type as enum ('Gig', 'Collab', 'Internship', 'Showcase', 'Other');
create type item_status as enum ('Not started', 'In progress', 'Done');

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date timestamptz not null,
  location text,
  type event_type not null default 'Other',
  status item_status not null default 'Not started',
  created_at timestamptz not null default now()
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type opportunity_type not null default 'Other',
  contact_link text,
  status item_status not null default 'Not started',
  created_at timestamptz not null default now()
);

create table e_board_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  week_of date not null,
  submitted_by text not null,
  summary text,
  action_items text,
  created_at timestamptz not null default now()
);

create table leadership_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  updated_at timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------
-- Auth is invite-only (Phase 4), so "authenticated" == "E-Board member".
-- No separate roles table needed.

alter table events enable row level security;
alter table opportunities enable row level security;
alter table e_board_members enable row level security;
alter table weekly_reports enable row level security;
alter table leadership_notes enable row level security;

-- Public read, E-Board write
create policy "public can read events" on events for select using (true);
create policy "authenticated can write events" on events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read opportunities" on opportunities for select using (true);
create policy "authenticated can write opportunities" on opportunities for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read e_board_members" on e_board_members for select using (true);
create policy "authenticated can write e_board_members" on e_board_members for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- E-Board only — no public policy at all, so these never reach the public site
create policy "authenticated can read weekly_reports" on weekly_reports for select
  using (auth.role() = 'authenticated');
create policy "authenticated can insert weekly_reports" on weekly_reports for insert
  with check (auth.role() = 'authenticated');
create policy "authenticated can update weekly_reports" on weekly_reports for update
  using (auth.role() = 'authenticated');

create policy "authenticated can read leadership_notes" on leadership_notes for select
  using (auth.role() = 'authenticated');
create policy "authenticated can insert leadership_notes" on leadership_notes for insert
  with check (auth.role() = 'authenticated');
create policy "authenticated can update leadership_notes" on leadership_notes for update
  using (auth.role() = 'authenticated');

-- Storage bucket for E-Board headshots (public read, authenticated write)
insert into storage.buckets (id, name, public)
  values ('eboard-photos', 'eboard-photos', true)
  on conflict (id) do nothing;

create policy "public can view eboard photos" on storage.objects for select
  using (bucket_id = 'eboard-photos');
create policy "authenticated can upload eboard photos" on storage.objects for insert
  with check (bucket_id = 'eboard-photos' and auth.role() = 'authenticated');
