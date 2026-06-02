-- Run if question_bank or quiz_shares return 404 (partial schema from an older install).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

-- Question bank
create table if not exists public.question_bank (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null default 'mc',
  question    text not null default '',
  answers     jsonb not null default '[]'::jsonb,
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

-- Quiz shares
create table if not exists public.quiz_shares (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  quiz_title  text not null default 'Shared quiz',
  questions   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists quiz_shares_code_idx on public.quiz_shares (code);

alter table public.quiz_shares enable row level security;

drop policy if exists "shares: select public" on public.quiz_shares;
create policy "shares: select public"
  on public.quiz_shares for select
  using (true);

drop policy if exists "shares: insert own" on public.quiz_shares;
create policy "shares: insert own"
  on public.quiz_shares for insert
  with check (auth.uid() = owner_id);

drop policy if exists "shares: delete own" on public.quiz_shares;
create policy "shares: delete own"
  on public.quiz_shares for delete
  using (auth.uid() = owner_id);
