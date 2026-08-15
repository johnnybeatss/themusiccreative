-- Optional per-member social links, shown as small icon links on the Team page.
alter table e_board_members
  add column if not exists instagram_url text,
  add column if not exists linkedin_url text;
