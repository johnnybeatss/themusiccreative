-- Event recap: a short post-event write-up stored on the event itself (not
-- a separate "recaps" section — that version was built and reverted in
-- e38697a). Shows on /events/[id] once the event is over, next to the
-- event's existing photo_urls, and auto-fills the weekly email's
-- "Last week at TMC" block when no manual recap photo was queued.
-- Same RLS as the rest of `events`: public read, owner/admin write.
alter table events add column if not exists recap text;
