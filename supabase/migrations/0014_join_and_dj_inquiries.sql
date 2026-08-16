-- Two new public-submit / owner-admin-read tables, same trust model as
-- `feedback` (0005 + 0011): anyone can insert, nobody can read except
-- owner/admin.
--
-- 1. join_submissions replaces the embedded Google Form on /join — fields
--    match the real form exactly (see src/app/join/JoinForm.tsx).
-- 2. dj_inquiries backs the new "EVENT DJ INQUIRIES" booking page.
--
-- Also adds opportunities.is_pinned so the DJ Inquiries listing (and any
-- future "always show this" posting) is exempt from the 60-day auto-hide
-- filter on the public Opportunities page.

create table join_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  fiu_email text not null,
  student_id text not null,
  phone text not null,
  major text not null,
  year text not null,
  creative_roles text[] not null default '{}',
  creative_role_other text,
  experience_length text not null,
  achievements text,
  portfolio_link text not null,
  club_goals text not null,
  wants_collab text not null,
  wants_to_perform text not null,
  signed_to_label text not null,
  workshop_ideas text,
  created_at timestamptz not null default now()
);

alter table join_submissions enable row level security;

create policy "anyone can submit join_submissions" on join_submissions
  for insert with check (true);

create policy "owner and admin can read join_submissions" on join_submissions
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create table dj_inquiries (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  email text not null,
  phone text,
  event_date date,
  event_type text not null,
  guest_count text,
  budget_range text,
  details text,
  created_at timestamptz not null default now()
);

alter table dj_inquiries enable row level security;

create policy "anyone can submit dj_inquiries" on dj_inquiries
  for insert with check (true);

create policy "owner and admin can read dj_inquiries" on dj_inquiries
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

alter table opportunities add column if not exists is_pinned boolean not null default false;
