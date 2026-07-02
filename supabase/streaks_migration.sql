-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists player_stats (
  player_id uuid primary key,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_played_date date
);

alter table player_stats enable row level security;

-- No login system yet, so these policies are intentionally open (any visitor's
-- browser can read/write any streak row via their random anonymous player id).
-- Fine for a low-stakes hobby game; revisit if real accounts are added later.
create policy "Public can read player_stats"
  on player_stats for select
  using (true);

create policy "Public can insert player_stats"
  on player_stats for insert
  with check (true);

create policy "Public can update player_stats"
  on player_stats for update
  using (true);
