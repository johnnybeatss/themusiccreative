-- Optional per-week content for the weekly email: a primary CTA override,
-- a subject line override, a member spotlight, and a "last week" recap
-- photo. All entirely optional — an owner/admin fills in whatever they
-- want on /eboard/weekly-email sometime during the week, and the Monday
-- cron route (src/app/api/cron/weekly-email-draft) bakes whatever's
-- present into that week's draft, then clears the row so next week starts
-- blank instead of silently reusing stale content.
--
-- Single mutable row (fixed id) rather than a growing table — there's
-- never more than one "pending" set of extras at a time, so update-in-place
-- is simpler than figuring out which row is current.

create table weekly_email_extras (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  primary_cta_label text,
  primary_cta_url text,
  subject_override text,
  member_spotlight_name text,
  member_spotlight_text text,
  member_spotlight_link text,
  recap_photo_url text,
  recap_caption text,
  updated_at timestamptz not null default now()
);

insert into weekly_email_extras (id)
values ('00000000-0000-0000-0000-000000000001');

alter table weekly_email_extras enable row level security;

create policy "owner and admin can read weekly_email_extras" on weekly_email_extras
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can update weekly_email_extras" on weekly_email_extras
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
