-- Event recap posts — short write-ups (with an optional photo) published
-- on the site after workshops/showcases so they stay indexable by Google
-- instead of disappearing into Instagram's feed once posted there. See the
-- SEO content-gap analysis: this was the single highest-leverage content
-- gap identified.
--
-- Same owner/admin-write / public-read pattern as events and opportunities
-- (0001_init.sql) — Events/Opportunities/Team-tier write access, not
-- open to all authenticated E-board members, matching Johnny's stance on
-- Team/Weekly Reports (0025_tighten_team_and_reports_write_access.sql).
create table recaps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  photo_url text,
  event_id uuid references events(id) on delete set null,
  published_at timestamptz not null default now(),
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table recaps enable row level security;

create policy "public can read recaps" on recaps for select using (true);

create policy "owner and admin can write recaps" on recaps
  for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );
