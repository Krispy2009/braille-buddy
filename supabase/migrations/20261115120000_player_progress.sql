-- Player accounts: one row of saved progress per player.
--
-- Only the signed-in player can see or change their own row. The browser
-- uses the public (publishable) key, so these row level security policies
-- are what keep each player's progress private. Test them with
-- supabase/tests/rls_test.sql after running this.

create table public.player_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- The game's Progress object, as kept in localStorage (version 1).
  progress jsonb not null,
  -- Today's daily puzzle tries, as kept in localStorage. Null until played.
  daily jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.player_progress is
  'Braille Buddy progress, one row per player. Readable and writable only by that player (RLS).';

alter table public.player_progress enable row level security;

-- Signed-out visitors (anon) get nothing at all, not even with a policy
-- added by mistake later.
revoke all on table public.player_progress from anon;
revoke all on table public.player_progress from public;
grant select, insert, update, delete on table public.player_progress to authenticated;

-- "(select auth.uid())" rather than "auth.uid()" so Postgres works it out
-- once per query, not once per row.
create policy "Players can read their own progress"
  on public.player_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Players can add their own progress"
  on public.player_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players can change their own progress"
  on public.player_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players can delete their own progress"
  on public.player_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- "Delete my account": deletes the signed-in player from Supabase Auth.
-- Their email goes with it, and their progress row through the
-- "on delete cascade" above. security definer so it may delete from
-- auth.users, which players cannot touch directly; it only ever deletes
-- the caller. search_path is empty so every name must be schema-qualified
-- and cannot be hijacked.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = caller;
end;
$$;

comment on function public.delete_account() is
  'Deletes the calling player''s account (auth user, email and progress). Callable only when signed in.';

revoke all on function public.delete_account() from public;
revoke all on function public.delete_account() from anon;
grant execute on function public.delete_account() to authenticated;
