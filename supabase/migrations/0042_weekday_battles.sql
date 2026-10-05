-- Final weekly rhythm (Eastern time):
--   Mon 12:00 AM -> new battle opens: submit + vote
--   Fri 11:59 PM -> submissions and voting close
--   Sat          -> nothing (results stay hidden)
--   Sun ~noon    -> most-voted entry auto-becomes the site spotlight
--                   (Vercel cron, src/app/api/cron/crown-battle/route.ts)
--   Mon          -> repeat
-- Replaces 0041's full-week version. Trigger + RLS from 0040 unchanged.

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
  update beat_battles set status = 'closed'
   where week_start is not null and week_start < this_week and status <> 'closed';

  if dow between 1 and 5 then
    insert into beat_battles (title, description, status, week_start)
    values (
      'Spotlight Battle — Week of ' || to_char(this_week, 'Mon FMDD'),
      'Beats, songs, mixes — submit anything you made and vote on your favorite. Everything closes Friday 11:59 PM, and the winner is revealed Sunday.',
      'voting',
      this_week
    )
    on conflict (week_start) where week_start is not null do nothing;

    update beat_battles set status = 'voting'
     where week_start = this_week and status in ('submissions', 'closed')
       and winner_entry_id is null;
  else
    update beat_battles set status = 'closed'
     where week_start = this_week and status <> 'closed';
  end if;
end;
$$;

revoke all on function public.sync_spotlight_battles() from public, anon, authenticated;

select public.sync_spotlight_battles();
