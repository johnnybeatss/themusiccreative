-- Explicit display order for the /team page. Without this, row order is
-- whatever Postgres happens to return (not guaranteed to match insertion
-- order, especially after deletes/updates) — which is why JAYMUTT was
-- appearing before Johnny despite being added second.
alter table e_board_members
  add column if not exists sort_order integer not null default 0;

-- Backfill so existing rows have a stable initial order (President first).
update e_board_members set sort_order = 1 where role ilike 'Co-Founder & President' or role ilike 'President';
update e_board_members set sort_order = 2 where role ilike 'Vice President';
