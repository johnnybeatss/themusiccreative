-- Voting runs alongside submissions all week (Eastern time):
--   Mon 12:00 AM -> new battle opens: submit AND vote at the same time
--   Fri 11:59 PM -> everything closes
--   Sat ~1-2 AM  -> most-voted entry auto-becomes the site spotlight
--                   (Vercel cron, src/app/api/cron/crown-battle/route.ts)
--   Sat-Sun      -> no battle open; next one starts Monday
--
-- Scheduled battles (week_start set) sit in status 'voting' Mon-Fri and
-- accept new entries the whole time; those entries are auto-approved by a
-- trigger so they show up immediately. Manual battles (week_start null)
-- keep the old submissions -> voting flow with approval.

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
      'Beats, songs, mixes — submit anything you made and vote on your favorite. Everything closes Friday 11:59 PM, and the winner takes over the site player for the next week.',
      'voting',
      this_week
    )
    on conflict (week_start) where week_start is not null do nothing;

    -- A battle created under the old schedule (status 'submissions'):
    -- approve what's in it and open voting now.
    update battle_entries e set approved_at = now()
      from beat_battles b
     where e.battle_id = b.id and b.week_start = this_week
       and b.status = 'submissions' and e.approved_at is null;
    update beat_battles set status = 'voting'
     where week_start = this_week and status = 'submissions';
  else
    update beat_battles set status = 'closed'
     where week_start = this_week and status <> 'closed';
  end if;
end;
$$;

revoke all on function public.sync_spotlight_battles() from public, anon, authenticated;

-- Entries to a scheduled battle are approved on arrival (the browser can't
-- control this — the trigger always decides). SECURITY DEFINER so it can
-- read the battle regardless of the caller.
create or replace function public.auto_approve_scheduled_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from beat_battles b where b.id = new.battle_id and b.week_start is not null) then
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists battle_entries_auto_approve on battle_entries;
create trigger battle_entries_auto_approve
  before insert on battle_entries
  for each row execute function public.auto_approve_scheduled_entry();

-- Public entry rules (checked AFTER the trigger above runs):
--   manual battle    -> only while 'submissions', must arrive unapproved
--   scheduled battle -> while 'submissions' or 'voting' (trigger approves)
drop policy if exists "anyone can enter an open battle" on battle_entries;
create policy "anyone can enter an open battle" on battle_entries
  for insert with check (
    read_at is null
    and source_submission_id is null
    and exists (
      select 1 from beat_battles b
      where b.id = battle_id
        and (
          (b.week_start is null and b.status = 'submissions' and approved_at is null)
          or (b.week_start is not null and b.status in ('submissions', 'voting'))
        )
    )
  );

-- Apply right away (moves this week's battle to the new schedule).
select public.sync_spotlight_battles();
