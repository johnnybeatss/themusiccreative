-- New "Join the Team" feature — a separate, more formal application for
-- people who want to be on E-board/leadership specifically, distinct from
-- the general club membership form at /join (join_submissions). Resumes
-- are stored in a PRIVATE bucket (not the public content-photos/eboard-
-- photos pattern used elsewhere) since they're PII and Johnny wants this
-- viewable by owner/admin only, same restriction as the row data itself.

create table team_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  role_interest text not null,
  why_join text,
  resume_path text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table team_applications enable row level security;

-- Same public-insert / owner-admin-read-write-delete trust model as
-- join_submissions and dj_inquiries (0014, 0016, 0017, 0018).
create policy "anyone can submit team_applications" on team_applications
  for insert with check (true);

create policy "owner and admin can read team_applications" on team_applications
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- Update is only ever used for marking read_at (see actions.ts) — same
-- shared-team-inbox read-state model as feedback/join_submissions/dj_inquiries.
create policy "owner and admin can update team_applications" on team_applications
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can delete team_applications" on team_applications
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

-- Private bucket for resumes — `public: false`, unlike eboard-photos/
-- content-photos. Anyone can upload (public application form, no login),
-- but only owner/admin can ever read or delete a file back out. Resume
-- links shown in the admin UI are short-lived signed URLs generated
-- server-side per request (see team-applications/page.tsx), never a
-- public getPublicUrl().
insert into storage.buckets (id, name, public)
  values ('team-resumes', 'team-resumes', false)
  on conflict (id) do nothing;

create policy "anyone can upload team resumes" on storage.objects for insert
  with check (bucket_id = 'team-resumes');

create policy "owner and admin can read team resumes" on storage.objects for select
  using (
    bucket_id = 'team-resumes'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can delete team resumes" on storage.objects for delete
  using (
    bucket_id = 'team-resumes'
    and exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
