-- Same shared-team-inbox unread/read-state model as feedback (0012):
-- read_at lives on the row itself, not per-user — once any owner/admin has
-- seen a submission, it's read for everyone. Powers the unread badges in
-- the E-Board sidebar and dashboard for Join Submissions and DJ Inquiries.

alter table join_submissions add column if not exists read_at timestamptz;
alter table dj_inquiries add column if not exists read_at timestamptz;

create policy "owner and admin can update join_submissions" on join_submissions
  for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can update dj_inquiries" on dj_inquiries
  for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
