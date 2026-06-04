-- Security hardening: stop listing all quiz_shares via the anon key.
-- Run in Supabase SQL Editor after schema.sql (safe to re-run).

drop policy if exists "shares: select public" on public.quiz_shares;

-- Owners can read their own share rows (dashboard / management).
drop policy if exists "shares: select own" on public.quiz_shares;
create policy "shares: select own"
  on public.quiz_shares for select
  using (auth.uid() = owner_id);

-- Lookup by code only (no table scan from the client).
create or replace function public.get_quiz_share_by_code(share_code text)
returns table (
  id uuid,
  code text,
  quiz_title text,
  questions jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.code, s.quiz_title, s.questions, s.created_at
  from public.quiz_shares s
  where s.code = upper(trim(share_code))
  limit 1;
$$;

revoke all on function public.get_quiz_share_by_code(text) from public;
grant execute on function public.get_quiz_share_by_code(text) to anon, authenticated;
