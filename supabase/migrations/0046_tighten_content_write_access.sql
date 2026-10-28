-- 0046: tighten leftover "any signed-in user can write" policies.
--
-- 0001 / 0007 / 0013 let ANY authenticated account write these, and only
-- the app's canManage() checks kept E-Board-tier accounts out. RLS is
-- supposed to be the real gate, so restrict them to owner/admin like
-- everything else. Every upload flow that touches these (Opportunities,
-- Feed Videos, Team headshots, weekly email photo) is already owner/admin
-- only in the app, so nothing legitimate breaks. Public reads unchanged.

-- opportunities --------------------------------------------------------
drop policy if exists "authenticated can write opportunities" on opportunities;
create policy "owner and admin can write opportunities" on opportunities
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin')))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin')));

-- feed_videos ----------------------------------------------------------
drop policy if exists "authenticated can write feed_videos" on feed_videos;
create policy "owner and admin can write feed_videos" on feed_videos
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin')))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin')));

-- storage: feed-videos -------------------------------------------------
drop policy if exists "authenticated can upload feed-videos" on storage.objects;
drop policy if exists "authenticated can delete feed-videos" on storage.objects;
create policy "owner and admin can upload feed-videos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'feed-videos'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
  );
create policy "owner and admin can delete feed-videos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'feed-videos'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
  );

-- storage: eboard-photos (team headshots) -------------------------------
drop policy if exists "authenticated can upload eboard photos" on storage.objects;
create policy "owner and admin can upload eboard photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'eboard-photos'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
  );

-- storage: content-photos (event/opportunity covers, email photo) -------
drop policy if exists "authenticated can write content photos" on storage.objects;
create policy "owner and admin can write content photos" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'content-photos'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
  )
  with check (
    bucket_id = 'content-photos'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner','admin'))
  );
