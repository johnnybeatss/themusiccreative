-- Collab Board: "producer looking for a vocalist", "rapper needs beats",
-- etc. Anyone can post; E-Board approves before it goes public. Contact is
-- Instagram only — no emails or phone numbers are collected or shown.
-- Posts drop off the public board 30 days after approval.

create table collab_posts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null
    check (role in ('Producer', 'Artist', 'Songwriter', 'DJ', 'Engineer', 'Other')),
  looking_for text not null,
  details text,
  instagram_url text not null,
  -- Optional link to their work (SoundCloud, YouTube, Spotify, etc.).
  sample_url text,
  approved_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index collab_posts_approved_idx on collab_posts (approved_at desc);

alter table collab_posts enable row level security;

create policy "anyone can submit a collab post" on collab_posts
  for insert with check (approved_at is null and read_at is null);

create policy "public can read approved recent collab posts" on collab_posts
  for select using (approved_at is not null and approved_at > now() - interval '30 days');

create policy "owner and admin manage collab posts" on collab_posts
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );
