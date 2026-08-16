-- Feedback responses were readable by any signed-in E-Board member
-- (0005's "authenticated can read feedback"). Restrict to owner/admin only
-- to match the delete policy that already existed. Also adds a per-user
-- "last viewed" timestamp so the E-Board sidebar can show an unread count.

drop policy "authenticated can read feedback" on feedback;

create policy "owner and admin can read feedback" on feedback for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

alter table profiles
  add column if not exists feedback_last_viewed_at timestamptz;
