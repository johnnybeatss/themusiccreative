-- Weekly Spotlight Battle on autopilot (all times America/New_York):
--   Mon 12:00 AM  -> a new battle is created, taking submissions
--   Sat 12:00 AM  -> submissions close (after Fri 11:59 PM), pending
--                    entries auto-approve, voting opens
--   Mon 12:00 AM  -> voting closes (after Sun 11:59 PM), next battle opens
-- Mon ~1-2 AM  -> most-voted entry auto-becomes the site spotlight
--                 (Vercel cron: src/app/api/cron/crown-battle/route.ts)
--
-- Runs inside the database via pg_cron every minute, so timing is exact
-- to the minute and DST is handled by converting to Eastern time in SQL
-- (pg_cron itself schedules in UTC). Only ever moves a battle FORWARD, so
-- a manual change on /eboard/battles never gets undone.

alter table beat_battles add column if not exists week_start date;
create unique index if not exists beat_battles_week_start_unique
  on beat_battles (week_start) where week_start is not null;

create or replace function public.sync_spotlight_battles()
returns void
language plpgsql
set search_path = public
as $$
declare
  local_now timestamp := now() at time zone 'America/New_York';
  this_week date := date_trunc('week', local_now)::date; -- Monday
  dow int := extract(isodow from local_now)::int;        -- 1 = Mon ... 7 = Sun
begin
  -- Anything scheduled for an earlier week is over.
  update beat_battles
     set status = 'closed'
   where week_start is not null
     and week_start < this_week
     and status <> 'closed';

  if dow between 1 and 5 then
    -- Mon-Fri: this week's battle exists and is taking submissions.
    insert into beat_battles (title, description, status, week_start)
    values (
      'Spotlight Battle — Week of ' || to_char(this_week, 'Mon FMDD'),
      'Beats, songs, mixes — submit anything you made. Submissions close Friday 11:59 PM, voting runs all weekend, winner gets the weekly spotlight.',
      'submissions',
      this_week
    )
    on conflict (week_start) where week_start is not null do nothing;
  else
    -- Sat-Sun: close submissions, approve what came in, open voting.
    update battle_entries e
       set approved_at = now()
      from beat_battles b
     where e.battle_id = b.id
       and b.week_start = this_week
       and b.status = 'submissions'
       and e.approved_at is null;

    update beat_battles
       set status = 'voting'
     where week_start = this_week
       and status = 'submissions';
  end if;
end;
$$;

-- Not callable from the browser (functions are executable by everyone by
-- default) — only pg_cron runs it.
revoke all on function public.sync_spotlight_battles() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'spotlight-battle-schedule',
  '* * * * *',
  $$select public.sync_spotlight_battles()$$
);

-- Run once now so this week's battle shows up immediately.
select public.sync_spotlight_battles();
