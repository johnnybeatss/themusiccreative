-- Public submission queue for the Weekly Spotlight — the "Submit Your
-- Track" card on the homepage. Distinct from weekly_track (0009), which is
-- the single currently-live record only the owner controls. Submissions
-- here get shortlisted by owner/admin, put up as an Instagram Story
-- bracket for members to vote on, and the winner is pushed live with the
-- "Feature this" action (see eboard/track-submissions/actions.ts), which
-- copies the file into the weekly-track bucket and inserts a weekly_track
-- row — no need to re-upload the winner by hand.
--
-- A submission needs at least one way to actually hear it: an uploaded
-- file, a Spotify link, or an Apple Music link.

create table track_submissions (
  id uuid primary key default gen_random_uuid(),
  track_title text not null,
  artist_name text not null,
  artist_instagram_url text not null,
  spotify_url text,
  apple_music_url text,
  storage_path text,
  read_at timestamptz,
  -- Set when a submission gets promoted to weekly_track via "Feature
  -- this" — lets the admin inbox show a "Featured" badge instead of the
  -- row just disappearing, since past submissions stay useful history
  -- for a weekly-recurring bracket.
  featured_at timestamptz,
  created_at timestamptz not null default now(),
  constraint track_submissions_has_a_source check (
    spotify_url is not null or apple_music_url is not null or storage_path is not null
  )
);

alter table track_submissions enable row level security;

-- Same public-insert / owner-admin-read-write-delete trust model as
-- join_submissions, dj_inquiries, and team_applications (0014, 0021).
create policy "anyone can submit track_submissions" on track_submissions
  for insert with check (true);

create policy "owner and admin can read track_submissions" on track_submissions
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- Covers marking read/featured — same shared-team-inbox update model as
-- team_applications.
create policy "owner and admin can update track_submissions" on track_submissions
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can delete track_submissions" on track_submissions
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- Private bucket — unlike weekly-track (public), submissions haven't been
-- reviewed yet, so only owner/admin can ever read a file back out. Same
-- pattern as team-resumes (0021): anyone can upload (public form, no
-- login), preview in the admin inbox uses short-lived signed URLs.
insert into storage.buckets (id, name, public)
  values ('track-submissions', 'track-submissions', false)
  on conflict (id) do nothing;

create policy "anyone can upload track submissions" on storage.objects for insert
  with check (bucket_id = 'track-submissions');

create policy "owner and admin can read track submission files" on storage.objects for select
  using (
    bucket_id = 'track-submissions'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can delete track submission files" on storage.objects for delete
  using (
    bucket_id = 'track-submissions'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
