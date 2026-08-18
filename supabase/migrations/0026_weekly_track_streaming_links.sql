-- Most artists submitting a track for the weekly spotlight already have it
-- live on Apple Music/Spotify — these let the owner attach those links so
-- the public player can offer a "listen on your platform of choice"
-- shortcut instead of only the uploaded audio file.
alter table weekly_track
  add column if not exists apple_music_url text,
  add column if not exists spotify_url text;
