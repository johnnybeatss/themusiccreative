-- Cover images for Events and Opportunities cards, plus a shared storage
-- bucket to hold them. Small files only (photos, not audio/video), so this
-- goes through the normal Server Action body — no need for the
-- client-direct-to-storage pattern used for the weekly track/feed videos.

alter table events add column if not exists image_url text;
alter table opportunities add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('content-photos', 'content-photos', true)
on conflict (id) do nothing;

create policy "public can read content photos" on storage.objects
  for select using (bucket_id = 'content-photos');

create policy "authenticated can write content photos" on storage.objects
  for all
  using (bucket_id = 'content-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'content-photos' and auth.role() = 'authenticated');
