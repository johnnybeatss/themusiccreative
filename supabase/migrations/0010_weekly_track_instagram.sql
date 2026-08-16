-- Optional Instagram credit for the artist behind the featured track.
alter table weekly_track
  add column if not exists artist_instagram_url text;
