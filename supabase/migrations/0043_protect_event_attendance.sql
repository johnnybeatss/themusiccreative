-- Deleting an event used to cascade-delete its RSVPs and QR check-ins
-- (0015, 0034), which wiped attendance and the leaderboard when a past
-- event was removed by accident. Now an event that has any RSVPs or
-- check-ins can't be deleted at all (the admin page explains why); it
-- just lives under Past Events.
alter table event_rsvps drop constraint if exists event_rsvps_event_id_fkey;
alter table event_rsvps
  add constraint event_rsvps_event_id_fkey
  foreign key (event_id) references events(id) on delete restrict;

alter table event_checkins drop constraint if exists event_checkins_event_id_fkey;
alter table event_checkins
  add constraint event_checkins_event_id_fkey
  foreign key (event_id) references events(id) on delete restrict;
