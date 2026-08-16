-- Replaces the whole-page "mark everything viewed on visit" approach (0011)
-- with per-message read state: a shared team-inbox model, not per-user —
-- once any owner/admin has seen a response, it's read for everyone. Simpler
-- than a per-user join table and matches how a small shared inbox actually
-- gets used.

alter table feedback
  add column if not exists read_at timestamptz;

create policy "owner and admin can update feedback" on feedback for update
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

-- No longer used now that read state lives per-message.
alter table profiles drop column if exists feedback_last_viewed_at;
