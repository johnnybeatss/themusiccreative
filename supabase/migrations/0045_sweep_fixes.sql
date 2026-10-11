-- Sweep fixes (Oct 11).
--
-- 1) sync_spotlight_battles() re-opened ANY closed scheduled battle for the
--    current week on Mon-Fri (left over from the 0040 -> 0041 schedule
--    switch). Effect: if E-Board manually closed this week's battle
--    mid-week, the every-minute timer silently re-opened it within 60s.
--    Now it only forward-migrates legacy 'submissions' battles; a manual
--    close sticks. Mon-Fri open / Sat close behavior is unchanged.
create or replace function public.sync_spotlight_battles()
returns void
language plpgsql
set search_path = public
as $$
declare
  local_now timestamp := now() at time zone 'America/New_York';
  this_week date := date_trunc('week', local_now)::date;
  dow int := extract(isodow from local_now)::int;
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
     where week_start = this_week and status = 'submissions';
  else
    update beat_battles set status = 'closed'
     where week_start = this_week and status <> 'closed';
  end if;
end;
$$;

revoke all on function public.sync_spotlight_battles() from public, anon, authenticated;

-- 2) The public upload buckets had no server-side size/type limits — the
--    20MB / audio-only rules only lived in the browser form, so anyone
--    calling the Storage API directly could upload any file of any size.
--    Enforce the same rules in Storage itself.
update storage.buckets
   set file_size_limit = 20971520,           -- 20 MB, same as the forms
       allowed_mime_types = array['audio/*']
 where id in ('battle-entries', 'track-submissions');
