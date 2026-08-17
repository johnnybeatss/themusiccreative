-- dj_inquiries previously only had INSERT (public), SELECT (owner/admin),
-- and UPDATE (owner/admin, 0017) policies — no DELETE, which RLS defaults
-- to deny. Adds owner/admin delete access, same as join_submissions (0016).

create policy "owner and admin can delete dj_inquiries" on dj_inquiries
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
