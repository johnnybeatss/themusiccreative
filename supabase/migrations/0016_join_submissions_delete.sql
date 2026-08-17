-- join_submissions previously only had INSERT (public) and SELECT
-- (owner/admin) policies — no DELETE policy at all, which RLS defaults to
-- deny. This adds owner/admin delete access so spam/duplicate/processed
-- submissions can be cleared out from the E-board hub.

create policy "owner and admin can delete join_submissions" on join_submissions
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
