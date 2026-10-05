-- Weekly Spotlight = a battle. Track submissions (homepage "Get your track
-- on the site" form) are now shortlisted straight into a battle from the
-- E-Board inbox, the community votes on the site instead of an Instagram
-- Story bracket, and the crowned winner becomes the weekly spotlight.
--
-- Entries can still be uploaded directly while a battle is taking
-- submissions (beat-battle style) — both sources live in battle_entries.

alter table battle_entries
  add column if not exists apple_music_url text,
  add column if not exists spotify_url text,
  -- Set when the entry came from the track submissions inbox, so crowning
  -- it can mark that submission as featured.
  add column if not exists source_submission_id uuid
    references track_submissions(id) on delete set null;

-- Same submission can't be added to the same battle twice.
create unique index if not exists battle_entries_source_unique
  on battle_entries (battle_id, source_submission_id)
  where source_submission_id is not null;

-- Public direct uploads must not be able to claim a submission (that link
-- only comes from the vetted inbox). Replaces the 0033 insert policy.
drop policy if exists "anyone can enter an open battle" on battle_entries;
create policy "anyone can enter an open battle" on battle_entries
  for insert with check (
    approved_at is null
    and read_at is null
    and source_submission_id is null
    and exists (
      select 1 from beat_battles b
      where b.id = battle_id and b.status = 'submissions'
    )
  );
