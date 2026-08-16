-- Weekly featured track: the site-wide bottom player + the "Meet The
-- E-Board" style admin page that swaps it out. Only the OWNER can write —
-- deliberately tighter than the usual owner/admin split, since this is a
-- club-wide spotlight, not routine content upkeep.

create table weekly_track (
  id uuid primary key default gen_random_uuid(),
  track_title text not null,
  artist_name text not null,
  storage_path text not null,
  updated_at timestamptz not null default now()
);

alter table weekly_track enable row level security;

create policy "public can read weekly_track" on weekly_track for select
  using (true);

create policy "owner can write weekly_track" on weekly_track for all
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'
    )
  );

insert into storage.buckets (id, name, public)
values ('weekly-track', 'weekly-track', true)
on conflict (id) do nothing;

create policy "public can read weekly-track files" on storage.objects
  for select using (bucket_id = 'weekly-track');

create policy "owner can write weekly-track files" on storage.objects
  for all
  using (
    bucket_id = 'weekly-track'
    and exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'
    )
  )
  with check (
    bucket_id = 'weekly-track'
    and exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'
    )
  );
