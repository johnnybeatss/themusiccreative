-- One submission flow for all music (beats, songs, mixes, anything): the
-- homepage form drops straight into whichever Spotlight Battle is taking
-- submissions, or into the Track Submissions inbox when none is open.
-- `kind` is just a label shown next to each entry.
alter table battle_entries
  add column if not exists kind text check (kind in ('Beat', 'Song', 'Mix', 'Other'));
alter table track_submissions
  add column if not exists kind text check (kind in ('Beat', 'Song', 'Mix', 'Other'));
