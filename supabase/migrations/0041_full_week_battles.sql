-- Battles run the full week (Eastern time):
--   Mon 12:00 AM  -> new battle opens: submit + vote all week, weekend included
--   Sun 11:59 PM  -> everything closes
--   Mon ~1-2 AM   -> most-voted entry auto-becomes the site spotlight
--                    (Vercel cron, src/app/api/cron/crown-battle/route.ts)
-- Replaces the Mon-Fri version from 0040. Trigger + RLS from 0040 unchanged.

create or replace function public.sync_spotlight_battles()
returns void
language plpgsql
set search_path = public
as $$
declare
  local_now timestamp := now() at time zone 'America/New_York';
  this_week date := date_trunc('week', local_now)::date; -- Monday
begin
  -- Last week's battle (and anything older) is over.
  update beat_battles set status = 'closed'
   where week_start is not null and week_start < this_week and status <> 'closed';

  insert into beat_battles (title, description, status, week_start)
  values (
    'Spotlight Battle — Week of ' || to_char(this_week, 'Mon FMDD'),
    'Beats, songs, mixes — submit anything you made and vote on your favorite. Everything closes Sunday 11:59 PM, and the winner takes over the site player for the next week.',
    'voting',
    this_week
  )
  on conflict (week_start) where week_start is not null do nothing;

  -- If this week's battle got closed early (e.g. under the old Fri cutoff),
  -- reopen it — the week isn't over yet.
  update beat_battles set status = 'voting'
   where week_start = this_week and status in ('submissions', 'closed')
     and winner_entry_id is null;
end;
$$;

revoke all on function public.sync_spotlight_battles() from public, anon, authenticated;

select public.sync_spotlight_battles();
