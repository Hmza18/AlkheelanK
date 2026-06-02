-- AlkheelanK database schema for Supabase.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Auth itself is handled by Supabase Auth (email + password); these tables just
-- store each host's saved quizzes, question bank, game history, and shared
-- quizzes, locked down with RLS so a user only ever sees their own rows.
-- (Exception: quiz_shares has public SELECT so anyone with the code can import.)

-- ---------------------------------------------------------------------------
-- Saved quizzes
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled quiz',
  questions   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists quizzes_user_id_idx on public.quizzes (user_id);

alter table public.quizzes enable row level security;

drop policy if exists "quizzes: select own" on public.quizzes;
create policy "quizzes: select own"
  on public.quizzes for select
  using (auth.uid() = user_id);

drop policy if exists "quizzes: insert own" on public.quizzes;
create policy "quizzes: insert own"
  on public.quizzes for insert
  with check (auth.uid() = user_id);

drop policy if exists "quizzes: update own" on public.quizzes;
create policy "quizzes: update own"
  on public.quizzes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "quizzes: delete own" on public.quizzes;
create policy "quizzes: delete own"
  on public.quizzes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Question bank (individual questions saved outside of any quiz)
-- ---------------------------------------------------------------------------
create table if not exists public.question_bank (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null default 'mc',          -- 'mc' | 'tf'
  question    text not null default '',
  answers     jsonb not null default '[]'::jsonb,  -- array of strings
  correct     int not null default 0,
  time_limit  int not null default 20,
  image       text,
  created_at  timestamptz not null default now()
);

create index if not exists question_bank_user_id_idx on public.question_bank (user_id);

alter table public.question_bank enable row level security;

drop policy if exists "bank: select own" on public.question_bank;
create policy "bank: select own"
  on public.question_bank for select
  using (auth.uid() = user_id);

drop policy if exists "bank: insert own" on public.question_bank;
create policy "bank: insert own"
  on public.question_bank for insert
  with check (auth.uid() = user_id);

drop policy if exists "bank: delete own" on public.question_bank;
create policy "bank: delete own"
  on public.question_bank for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Quiz shares (snapshot copy — edits don't affect the original)
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_shares (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,               -- short 8-char hex code
  owner_id    uuid not null references auth.users (id) on delete cascade,
  quiz_title  text not null default 'Shared quiz',
  questions   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists quiz_shares_code_idx on public.quiz_shares (code);

alter table public.quiz_shares enable row level security;

-- Anyone with the code can view a share (to preview + import).
drop policy if exists "shares: select public" on public.quiz_shares;
create policy "shares: select public"
  on public.quiz_shares for select
  using (true);

-- Only the owner can create a share.
drop policy if exists "shares: insert own" on public.quiz_shares;
create policy "shares: insert own"
  on public.quiz_shares for insert
  with check (auth.uid() = owner_id);

-- Only the owner can delete their share.
drop policy if exists "shares: delete own" on public.quiz_shares;
create policy "shares: delete own"
  on public.quiz_shares for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- Game history (one row per finished game)
-- ---------------------------------------------------------------------------
create table if not exists public.game_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  quiz_title    text not null default 'Quiz',
  player_count  int not null default 0,
  winner        text,
  played_at     timestamptz not null default now()
);

create index if not exists game_history_user_id_idx on public.game_history (user_id);

alter table public.game_history enable row level security;

drop policy if exists "history: select own" on public.game_history;
create policy "history: select own"
  on public.game_history for select
  using (auth.uid() = user_id);

drop policy if exists "history: insert own" on public.game_history;
create policy "history: insert own"
  on public.game_history for insert
  with check (auth.uid() = user_id);
