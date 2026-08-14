-- Adds two things:
--
-- 1. display_name on profiles, so E-Board members can be identified by
--    name (not just role) wherever their activity shows up — starting
--    with "Posted by X" on leadership notes.
--
-- 2. A public `feedback` table for the site's new /feedback board.
--    Anyone (including anonymous visitors) can submit; nobody can read
--    submissions except signed-in E-Board members, and nothing here is
--    ever exposed on the public site.

-- 1. display_name -------------------------------------------------------

alter table profiles add column display_name text;

-- Members set their own name from the app (/eboard/profile). Column-level
-- grants restrict this to display_name only — the broad "auth.uid() = id"
-- row check alone would otherwise let someone UPDATE their own `role`
-- column too, which would be a privilege-escalation bug (self-promoting
-- to owner/admin). Revoking table-level UPDATE and re-granting it for
-- just this one column closes that off regardless of what the RLS policy
-- allows at the row level.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "users can update own display name" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Replaces "users can read own profile" (0003) with a broader, still
-- non-recursive policy: everyone signed in can see everyone else's name
-- and role tier. This is required for "Posted by X" to resolve on other
-- people's notes — PostgREST embeds (leadership_notes -> profiles) are
-- subject to profiles' own RLS, so without this, other members' names
-- would silently come back null. auth.role() = 'authenticated' checks
-- the JWT claim directly (no subquery into profiles), so unlike the
-- policy removed in 0004, this cannot recurse.
drop policy "users can read own profile" on profiles;

create policy "authenticated can read all profiles" on profiles for select
  using (auth.role() = 'authenticated');

-- 2. feedback -------------------------------------------------------

create table feedback (
  id uuid primary key default gen_random_uuid(),
  name text,
  category text not null default 'General',
  message text not null,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

-- Open to everyone, including anonymous site visitors — this is the
-- entire point of the board. No update/delete policy for submitters:
-- once sent, a response can't be edited or pulled back except by
-- owner/admin (below).
create policy "anyone can submit feedback" on feedback for insert
  with check (true);

-- No public select policy exists on this table at all, on purpose —
-- responses are never visible outside the signed-in E-Board area.
create policy "authenticated can read feedback" on feedback for select
  using (auth.role() = 'authenticated');

create policy "owner and admin can delete feedback" on feedback for delete
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- 3. leadership_notes author attribution ---------------------------

alter table leadership_notes
  add column author_id uuid references public.profiles(id) on delete set null;
