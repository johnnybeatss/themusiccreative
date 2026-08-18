-- Tightens two tables that were left open to "any authenticated user"
-- since their original build, to match the owner/admin-only write
-- pattern already used for events/leadership_notes (see 0003_roles.sql):
--
-- e_board_members  — eboard-tier members can view the Team hub but not
--                     add/edit/delete entries. Public read is untouched.
-- weekly_report_items — eboard-tier members can view the To-Do/Content
--                     Ideas lists but not add/check off/edit them.
--                     Delete was already owner/admin-only (0020); this
--                     just brings insert/update in line with it.

drop policy "authenticated can write e_board_members" on e_board_members;

create policy "owner and admin can write e_board_members" on e_board_members
  for all
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

drop policy "authenticated can insert weekly_report_items" on weekly_report_items;
drop policy "authenticated can update weekly_report_items" on weekly_report_items;

create policy "owner and admin can insert weekly_report_items" on weekly_report_items
  for insert with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );

create policy "owner and admin can update weekly_report_items" on weekly_report_items
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role in ('owner', 'admin')
    )
  );
