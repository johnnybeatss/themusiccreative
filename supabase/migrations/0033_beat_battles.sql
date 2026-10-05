-- Beat Battles: E-Board opens a battle, producers submit a beat, E-Board
-- approves entries, anyone online votes (one vote per browser per battle),
-- and the winner gets pushed into the weekly spotlight player.
--
-- Trust model:
--   * beat_battles  — public can read non-draft battles; owner/admin write.
--   * battle_entries — anyone can submit while a battle is taking
--     submissions; the public only ever sees APPROVED entries (moderation,
--     same idea as track_submissions); owner/admin manage.
--   * battle_votes  — NO public policies at all. Votes are only written by
--     the server (service role) in src/app/battles/[id]/actions.ts, which
--     enforces one vote per browser cookie + a per-network cap. Keeps the
--     voter token / network hash out of reach of the browser entirely.

create table beat_battles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  -- The prompt/rules shown to producers ("flip this sample", "140 BPM
  -- drill", etc.)
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'submissions', 'voting', 'closed')),
  winner_entry_id uuid,
  created_at timestamptz not null default now()
);

create table battle_entries (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references beat_battles(id) on delete cascade,
  producer_name text not null,
  beat_title text,
  producer_instagram_url text,
  storage_path text not null,
  approved_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table beat_battles
  add constraint beat_battles_winner_fk
  foreign key (winner_entry_id) references battle_entries(id) on delete set null;

create table battle_votes (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references beat_battles(id) on delete cascade,
  entry_id uuid not null references battle_entries(id) on delete cascade,
  -- Random id kept in an httpOnly cookie — one vote per browser per battle.
  voter_token text not null,
  -- Salted SHA-256 of the voter's IP (never the raw IP) — used only to cap
  -- how many votes one network can cast in a single battle.
  ip_hash text not null,
  created_at timestamptz not null default now(),
  unique (battle_id, voter_token)
);

create index battle_entries_battle_idx on battle_entries (battle_id);
create index battle_votes_battle_idx on battle_votes (battle_id);
create index battle_votes_ip_idx on battle_votes (battle_id, ip_hash);

alter table beat_battles enable row level security;
alter table battle_entries enable row level security;
alter table battle_votes enable row level security;

-- beat_battles ----------------------------------------------------------
create policy "public can read live battles" on beat_battles
  for select using (status <> 'draft');

create policy "owner and admin manage battles" on beat_battles
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

-- battle_entries --------------------------------------------------------
create policy "anyone can enter an open battle" on battle_entries
  for insert with check (
    approved_at is null
    and read_at is null
    and exists (
      select 1 from beat_battles b
      where b.id = battle_id and b.status = 'submissions'
    )
  );

create policy "public can read approved entries" on battle_entries
  for select using (
    approved_at is not null
    and exists (
      select 1 from beat_battles b
      where b.id = battle_id and b.status <> 'draft'
    )
  );

create policy "owner and admin manage entries" on battle_entries
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

-- battle_votes ----------------------------------------------------------
-- Owner/admin can read raw votes for auditing; no one else gets any
-- access (the server writes with the service role, which bypasses RLS).
create policy "owner and admin read votes" on battle_votes
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

create policy "owner and admin delete votes" on battle_votes
  for delete using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

-- Storage ----------------------------------------------------------------
-- Private bucket: unapproved uploads must never be publicly reachable
-- (otherwise it's free anonymous file hosting). Approved entries are
-- played through short-lived signed URLs generated server-side.
insert into storage.buckets (id, name, public)
  values ('battle-entries', 'battle-entries', false)
  on conflict (id) do nothing;

create policy "anyone can upload battle entries" on storage.objects for insert
  with check (bucket_id = 'battle-entries');

create policy "owner and admin can read battle entry files" on storage.objects for select
  using (
    bucket_id = 'battle-entries'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );

create policy "owner and admin can delete battle entry files" on storage.objects for delete
  using (
    bucket_id = 'battle-entries'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('owner', 'admin'))
  );
