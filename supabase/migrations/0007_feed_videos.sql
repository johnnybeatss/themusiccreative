-- Self-service video wheel: E-Board (owner/admin) can add/remove the clips
-- shown in the homepage "Straight From The Feed" carousel without a code
-- change or deploy. Video files live in Supabase Storage; this table only
-- stores the storage path (not a public URL) so the URL is always derived
-- fresh from the bucket at read time — one source of truth.

create table feed_videos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text not null,
  instagram_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table feed_videos enable row level security;

create policy "public can read feed_videos" on feed_videos for select using (true);
create policy "authenticated can write feed_videos" on feed_videos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- (App-level access is further restricted to owner/admin via canManage() in
-- src/app/eboard/(protected)/videos/actions.ts, same pattern as events.)

-- Public bucket: files are served directly from Supabase's CDN, no signed
-- URLs needed. Free-tier global file size cap is 50MB per file (Supabase
-- Storage Settings) — keep clips compressed.
insert into storage.buckets (id, name, public)
values ('feed-videos', 'feed-videos', true)
on conflict (id) do nothing;

-- Public buckets serve GETs directly, so no SELECT policy is needed for
-- playback — only INSERT/DELETE need restricting to signed-in E-Board users.
create policy "authenticated can upload feed-videos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'feed-videos');

create policy "authenticated can delete feed-videos"
on storage.objects for delete
to authenticated
using (bucket_id = 'feed-videos');
