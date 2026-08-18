-- Missing from 0022: a DELETE policy for weekly_email_drafts. The admin
-- page's Delete button (WeeklyEmailPreview.tsx) calls
-- .from("weekly_email_drafts").delete() through the normal cookie-based
-- client, which is subject to RLS — with RLS enabled and no delete policy,
-- Postgres silently blocks the delete (0 rows affected, no error), which
-- is exactly the bug this fixes.

create policy "owner and admin can delete weekly_email_drafts" on weekly_email_drafts
  for delete using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
