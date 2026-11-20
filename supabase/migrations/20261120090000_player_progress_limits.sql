-- Player accounts: limit what one player can store in their own row.
--
-- A signed-in player is allowed to write to their own player_progress row,
-- and the "progress" and "daily" columns accept any JSON. Without a limit,
-- a player (or anyone who borrowed their sign-in) could save something huge
-- or oddly shaped. It could only ever fill their own row, but it would
-- still use up the database's space and slow down every sync.
--
-- These check constraints make the database refuse such a row, whatever
-- the app does. Real progress is far smaller: about 7 KB for every item of
-- every course, all lessons done and today's puzzle played, so the limits
-- leave plenty of room to grow.
--
--   progress: must be a JSON object, and at most 64 KB of text.
--   daily:    empty (null), or a JSON object of at most 8 KB of text.
--
-- A refused save fails with Postgres error 23514 (check_violation), which
-- the app shows as a sync error. Running this twice is harmless: each
-- constraint is dropped first if it is already there.

alter table public.player_progress
  drop constraint if exists player_progress_progress_limits;

alter table public.player_progress
  add constraint player_progress_progress_limits
  check (
    jsonb_typeof(progress) = 'object'
    and octet_length(progress::text) <= 65536
  );

alter table public.player_progress
  drop constraint if exists player_progress_daily_limits;

alter table public.player_progress
  add constraint player_progress_daily_limits
  check (
    daily is null
    or (
      jsonb_typeof(daily) = 'object'
      and octet_length(daily::text) <= 8192
    )
  );
