-- Event detail pages: description, extra gallery photos, workshop guest's
-- Instagram handle, and RSVPs. RSVPs use the same public-insert /
-- owner-admin-read RLS pattern as join_submissions and dj_inquiries (0014)
-- — confirmed with Johnny that RSVP viewing should be owner/admin only,
-- same tier as those two, not all e-board members.

alter table events add column description text;
alter table events add column guest_instagram_url text;
alter table events add column photo_urls text[] not null default '{}';

create table event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  guest_count text,
  notes text,
  created_at timestamptz not null default now()
);

alter table event_rsvps enable row level security;

create policy "anyone can submit event_rsvps" on event_rsvps
  for insert with check (true);

create policy "owner and admin can read event_rsvps" on event_rsvps
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
