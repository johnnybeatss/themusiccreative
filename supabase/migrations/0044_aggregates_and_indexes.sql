-- Performance pass (Batch A).
--
-- Supabase's API returns at most 1,000 rows per request. Vote tallies,
-- check-in counts and RSVP counts used to download raw rows and count them
-- in JS, so past 1,000 rows the totals were silently wrong (and the
-- auto-crown could pick the wrong winner). These functions count in the
-- database and return one small row per entry/event instead.
--
-- All are SECURITY INVOKER (the default): they run with the caller's RLS,
-- so they expose nothing a caller couldn't already read row by row.
-- The public battle page and the crown cron call them with the service
-- role; E-Board pages call them as owner/admin.

-- Vote totals per entry. Pass a battle id, or null for every battle.
create or replace function public.battle_vote_tally(p_battle_id uuid default null)
returns table (battle_id uuid, entry_id uuid, votes bigint)
language sql
stable
set search_path = public
as $$
  select v.battle_id, v.entry_id, count(*)::bigint
  from battle_votes v
  where p_battle_id is null or v.battle_id = p_battle_id
  group by v.battle_id, v.entry_id;
$$;

-- Networks with at least p_min_votes votes in a battle (abuse review on
-- /eboard/battles), broken down per entry.
create or replace function public.battle_network_flags(p_min_votes int default 5)
returns table (
  battle_id uuid, ip_hash text, entry_id uuid, votes bigint,
  network_total bigint, first_vote timestamptz, last_vote timestamptz
)
language sql
stable
set search_path = public
as $$
  with per_entry as (
    select v.battle_id, v.ip_hash, v.entry_id, count(*)::bigint as votes,
           min(v.created_at) as first_vote, max(v.created_at) as last_vote
    from battle_votes v
    group by v.battle_id, v.ip_hash, v.entry_id
  ), with_total as (
    select p.*, sum(p.votes) over (partition by p.battle_id, p.ip_hash)::bigint as network_total
    from per_entry p
  )
  select battle_id, ip_hash, entry_id, votes, network_total, first_vote, last_vote
  from with_total
  where network_total >= p_min_votes;
$$;

-- RSVP + check-in counts per event (E-Board check-in and past events pages).
create or replace function public.event_attendance_counts()
returns table (event_id uuid, rsvps bigint, checkins bigint)
language sql
stable
set search_path = public
as $$
  select e.id,
         (select count(*) from event_rsvps r where r.event_id = e.id)::bigint,
         (select count(*) from event_checkins c where c.event_id = e.id)::bigint
  from events e;
$$;

-- Indexes for the hot paths.
create index if not exists events_date_idx on events (date);
create index if not exists event_rsvps_event_idx on event_rsvps (event_id);
create index if not exists event_checkins_event_idx on event_checkins (event_id);
create index if not exists battle_votes_entry_idx on battle_votes (battle_id, entry_id);

-- Unread badges count rows where read_at is null on every E-Board page
-- load. Partial indexes keep those counts cheap as the inboxes grow.
create index if not exists feedback_unread_idx on feedback (id) where read_at is null;
create index if not exists join_submissions_unread_idx on join_submissions (id) where read_at is null;
create index if not exists dj_inquiries_unread_idx on dj_inquiries (id) where read_at is null;
create index if not exists team_applications_unread_idx on team_applications (id) where read_at is null;
create index if not exists track_submissions_unread_idx on track_submissions (id) where read_at is null;
create index if not exists battle_entries_unread_idx on battle_entries (id) where read_at is null;
create index if not exists collab_posts_unread_idx on collab_posts (id) where read_at is null;
