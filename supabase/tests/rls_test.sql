-- Row level security test for public.player_progress and delete_account().
--
-- Paste all of this into the Supabase SQL editor and run it, after the
-- migration in supabase/migrations. It changes nothing: everything happens
-- inside one transaction that is rolled back at the end.
--
-- Result:
--   PASS: the last result is a single row starting "PASS".
--   FAIL: it stops with an error starting "FAIL:" that says what leaked.
--
-- It makes two pretend players, A and B, each with a progress row, then
-- acts as B (signed in) and as a signed-out visitor (anon) and checks that
-- neither can read, change or delete A's progress.

begin;

-- ---- Set-up checks ------------------------------------------------------------

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.player_progress'::regclass) then
    raise exception 'FAIL: row level security is not enabled on public.player_progress';
  end if;
  if has_table_privilege('anon', 'public.player_progress', 'select')
    or has_table_privilege('anon', 'public.player_progress', 'insert')
    or has_table_privilege('anon', 'public.player_progress', 'update')
    or has_table_privilege('anon', 'public.player_progress', 'delete') then
    raise exception 'FAIL: signed-out visitors (anon) still have rights on public.player_progress';
  end if;
  if has_function_privilege('anon', 'public.delete_account()', 'execute') then
    raise exception 'FAIL: signed-out visitors (anon) can call delete_account()';
  end if;
  if not has_function_privilege('authenticated', 'public.delete_account()', 'execute') then
    raise exception 'FAIL: signed-in players cannot call delete_account()';
  end if;
end
$$;

-- Three pretend players: A and B with progress, C without. Fixed ids so the
-- checks below can name them; they are removed again by the rollback.
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-00000000000a', 'rls-test-a@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000b', 'rls-test-b@example.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000c', 'rls-test-c@example.invalid', 'authenticated', 'authenticated');

insert into public.player_progress (user_id, progress)
values
  ('00000000-0000-4000-8000-00000000000a', '{"version": 1, "points": 111}'),
  ('00000000-0000-4000-8000-00000000000b', '{"version": 1, "points": 222}');

-- ---- Act as player B, signed in ------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-00000000000b", "role": "authenticated"}',
  true
);

do $$
declare
  a constant uuid := '00000000-0000-4000-8000-00000000000a';
  b constant uuid := '00000000-0000-4000-8000-00000000000b';
  c constant uuid := '00000000-0000-4000-8000-00000000000c';
  n integer;
begin
  if auth.uid() is distinct from b then
    raise exception 'FAIL: could not act as player B (auth.uid() is %)', auth.uid();
  end if;

  -- Reading
  select count(*) into n from public.player_progress where user_id = a;
  if n <> 0 then
    raise exception 'FAIL: player B can read player A''s progress';
  end if;
  select count(*) into n from public.player_progress;
  if n <> 1 then
    raise exception 'FAIL: player B sees % rows, expected only their own', n;
  end if;

  -- Changing
  update public.player_progress set progress = '{"version": 1, "points": 0}' where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL: player B can change player A''s progress';
  end if;

  -- Deleting
  delete from public.player_progress where user_id = a;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL: player B can delete player A''s progress';
  end if;

  -- Changing or deleting everything at once, without naming a player.
  -- These are undone straight after, inside their own block.
  begin
    update public.player_progress set progress = '{"version": 1, "points": 0}';
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'FAIL: player B changed % rows with one update, expected only their own', n;
    end if;
    delete from public.player_progress;
    get diagnostics n = row_count;
    if n <> 1 then
      raise exception 'FAIL: player B deleted % rows with one delete, expected only their own', n;
    end if;
    raise exception using errcode = 'P0001', message = 'undo';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'undo' then
      raise;
    end if;
  end;

  -- Writing a row for someone else (C has no row yet)
  begin
    insert into public.player_progress (user_id, progress) values (c, '{"version": 1}');
    raise exception 'FAIL: player B can write a row for another player';
  exception when insufficient_privilege then
    null; -- refused by the policy, as it should be
  end;

  -- Moving their own row over to someone else
  begin
    update public.player_progress set user_id = c where user_id = b;
    raise exception 'FAIL: player B can give their row to player A';
  exception when insufficient_privilege then
    null;
  end;

  -- B can still use their own row, so the policies are not too strict.
  update public.player_progress set progress = '{"version": 1, "points": 333}' where user_id = b;
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FAIL: player B cannot change their own progress';
  end if;
end
$$;

-- ---- Act as a signed-out visitor (anon) ------------------------------------

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

do $$
declare
  n integer;
begin
  begin
    select count(*) into n from public.player_progress;
    if n <> 0 then
      raise exception 'FAIL: a signed-out visitor can read % progress rows', n;
    end if;
  exception when insufficient_privilege then
    null; -- no access at all, which is what we want
  end;

  begin
    insert into public.player_progress (user_id, progress)
    values ('00000000-0000-4000-8000-00000000000c', '{"version": 1}');
    raise exception 'FAIL: a signed-out visitor can write progress';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

-- ---- Player B deletes their account ----------------------------------------

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-00000000000b", "role": "authenticated"}',
  true
);

select public.delete_account();

reset role;

do $$
begin
  if exists (select 1 from auth.users where id = '00000000-0000-4000-8000-00000000000b') then
    raise exception 'FAIL: delete_account() left player B in auth.users';
  end if;
  if exists (select 1 from public.player_progress where user_id = '00000000-0000-4000-8000-00000000000b') then
    raise exception 'FAIL: delete_account() left player B''s progress';
  end if;
  if not exists (select 1 from auth.users where id = '00000000-0000-4000-8000-00000000000a')
    or not exists (select 1 from public.player_progress where user_id = '00000000-0000-4000-8000-00000000000a') then
    raise exception 'FAIL: delete_account() for player B touched player A';
  end if;
end
$$;

rollback;

select 'PASS: players only reach their own progress, signed-out visitors reach nothing, and delete_account() removes only the caller. Nothing was changed (rolled back).' as result;
