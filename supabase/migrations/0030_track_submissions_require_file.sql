-- Simplify submission requirements: an audio file is now required on
-- every submission. Spotify/Apple Music links stay optional extras,
-- shown as embedded players for preview (see StreamingEmbedButtons.tsx)
-- instead of being an alternative source. This guarantees "Feature this"
-- (track-submissions/actions.ts) always has a file to promote, so the
-- old "no audio file" disabled state goes away entirely.

alter table track_submissions
  drop constraint if exists track_submissions_has_a_source;

alter table track_submissions
  alter column storage_path set not null;
