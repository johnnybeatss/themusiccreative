-- QR event check-in + public attendance leaderboard.
--
-- Flow: E-Board generates a check-in code for an event, projects the QR
-- (/checkin/<code>) in the room, people scan and check in with their FIU
-- email — or just their name if they don't have one.
--
-- Trust model:
--   * event_checkin_codes — owner/admin only. Kept OUT of the events table
--     on purpose: events are publicly readable, so a code stored there
--     could be read with the anon key and used to check in from home.
--   * event_checkins — NO public policies. Rows are only written by the
--     server (service role) in src/app/checkin/[code]/actions.ts, which
--     checks the code and the event's time window first. Owner/admin can
--     read/delete for attendance.
--   * checkin_leaderboard() — the ONLY public view of this data. Returns
--     "First L." + a count, never emails or full names.

create table event_checkin_codes (
  event_id uuid primary key references events(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table event_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  -- Lowercased @fiu.edu address, or null for name-only check-ins.
  fiu_email text,
  -- Who this person is across events: the email when given, otherwise
  -- "name:first last" (lowercased). Two name-only people with the exact
  -- same name will share a leaderboard row — accepted tradeoff.
  identity_key text not null,
  show_on_leaderboard boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, identity_key)
);

create index event_checkins_identity_idx on event_checkins (identity_key);

alter table event_checkin_codes enable row level security;
alter table event_checkins enable row level security;

create policy "owner and admin manage checkin codes" on event_checkin_codes
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

create policy "owner and admin read checkins" on event_checkins
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

create policy "owner and admin delete checkins" on event_checkins
  for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

-- Public leaderboard. SECURITY DEFINER so it can aggregate a table the
-- public can't read; it only ever returns a display name + count.
create or replace function checkin_leaderboard(since timestamptz, max_rows int default 25)
returns table (display_name text, events_attended bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    initcap((array_agg(c.first_name order by c.created_at desc))[1])
      || ' '
      || upper(left((array_agg(c.last_name order by c.created_at desc))[1], 1))
      || '.' as display_name,
    count(*) as events_attended
  from event_checkins c
  join events e on e.id = c.event_id
  where e.date >= since
  group by c.identity_key
  -- Someone who opted out on ANY check-in stays off the board.
  having bool_and(c.show_on_leaderboard)
  order by events_attended desc, max(c.created_at) asc
  limit least(greatest(max_rows, 1), 100);
$$;

revoke all on function checkin_leaderboard(timestamptz, int) from public;
grant execute on function checkin_leaderboard(timestamptz, int) to anon, authenticated;
