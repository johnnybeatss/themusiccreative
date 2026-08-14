-- Adds a 3-tier role system: owner / admin / eboard.
-- Run in the Supabase SQL editor once, after 0001 and 0002 have already run.
--
-- owner  — full access to everything (there's only one: you).
-- admin  — can create/edit/delete events and leadership notes, same as
--          owner for those. (Google Calendar edit access is a SEPARATE
--          permission granted directly in Google Calendar's own sharing
--          settings — nothing in this database controls that.)
-- eboard — can view everything (events, notes, reports, drive resources)
--          but cannot add/edit/delete events or leadership notes.
--
-- After running this file, promote yourself:
--   update public.profiles set role = 'owner'
--   where id = (select id from auth.users where email = 'you@example.com');
-- and any admins the same way with role = 'admin'. Everyone else — existing
-- and newly invited — defaults to 'eboard'.

create type member_role as enum ('owner', 'admin', 'eboard');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role member_role not null default 'eboard',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Everyone can read their own role (the app needs this to decide what
-- controls to show). Owner can read everyone's role too, for any future
-- member-management view.
create policy "users can read own profile" on profiles for select
  using (auth.uid() = id);

create policy "owner can read all profiles" on profiles for select
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'
    )
  );

-- No insert/update/delete policies for regular users on purpose — roles
-- are assigned by hand in the Supabase dashboard (SQL editor or Table
-- Editor), not from the app. The service role key bypasses RLS entirely
-- if that's ever needed from a script.

-- Auto-create a profile row (defaulting to 'eboard') whenever someone new
-- signs in for the first time, so nobody falls through without a role.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'eboard')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone already invited before this migration ran.
insert into public.profiles (id, role)
select id, 'eboard' from auth.users
on conflict (id) do nothing;

-- Tighten events + leadership_notes write access to owner/admin only.
-- Public read access to events is untouched — "public can read events"
-- from 0001 already allows it and isn't dropped here.

drop policy "authenticated can write events" on events;

create policy "owner and admin can write events" on events for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- leadership_notes SELECT stays open to all authenticated (eboard members
-- can still view notes) — only the write policies get replaced.

drop policy "authenticated can insert leadership_notes" on leadership_notes;
drop policy "authenticated can update leadership_notes" on leadership_notes;
drop policy "authenticated can delete leadership_notes" on leadership_notes;

create policy "owner and admin can insert leadership_notes" on leadership_notes
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can update leadership_notes" on leadership_notes
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can delete leadership_notes" on leadership_notes
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
