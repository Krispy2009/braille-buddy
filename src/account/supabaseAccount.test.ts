import type { SupabaseClient } from "@supabase/supabase-js";
import { loadDailyState, saveDaily } from "../daily/storage";
import { emptyProgress, loadProgress, Progress, saveProgress } from "../game/progress";
import type { AccountConfig } from "./config";
import { AccountEvents, startAccount } from "./supabaseAccount";
import type { SyncStatus } from "./sync";

const config: AccountConfig = {
  url: "https://example.supabase.co",
  key: "sb_publishable_test",
  storageKey: "sb-example-auth-token",
};

const USER = { id: "user-1", email: "kim@example.com" };
const session = () => ({ access_token: "token", user: USER });

type Row = { progress: unknown; daily: unknown } | null;

type FakeOptions = {
  signedIn?: boolean;
  row?: Row;
  /** What every table request answers with instead of working. */
  tableError?: { message: string; code?: string };
  /** Reads work, but saving is refused. */
  upsertError?: { message: string; code?: string };
  rpcError?: { message: string; code?: string };
  otpError?: { message: string; code?: string; status?: number };
};

/** A stand-in for the Supabase client, with only what the account code uses. */
const fakeClient = (options: FakeOptions = {}) => {
  let current = options.signedIn ? session() : null;
  const state = { row: options.row ?? null, upserts: [] as Record<string, unknown>[] };
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () =>
      options.tableError
        ? { data: null, error: options.tableError }
        : { data: state.row, error: null }
    ),
    upsert: vi.fn(async (value: Record<string, unknown>) => {
      if (options.tableError) return { error: options.tableError };
      if (options.upsertError) {
        state.upserts.push(value);
        return { error: options.upsertError };
      }
      state.upserts.push(value);
      state.row = { progress: value.progress, daily: value.daily };
      return { error: null };
    }),
  };
  const client = {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      getSession: vi.fn(async () => ({ data: { session: current }, error: null })),
      signInWithOtp: vi.fn(async () => ({ data: {}, error: options.otpError ?? null })),
      verifyOtp: vi.fn(async ({ token }: { token?: string }) => {
        if (token !== "123456") {
          return {
            data: { session: null, user: null },
            error: { code: "otp_expired", status: 403, message: "Token has expired or is invalid" },
          };
        }
        current = session();
        return { data: { session: current, user: USER }, error: null };
      }),
      signOut: vi.fn(async () => {
        current = null;
        return { error: null };
      }),
    },
    from: vi.fn(() => query),
    rpc: vi.fn(async () => ({ data: null, error: options.rpcError ?? null })),
  };
  return { client, query, state };
};

const running: { dispose: () => void }[] = [];
afterEach(() => running.splice(0).forEach((service) => service.dispose()));

const start = async (fake: ReturnType<typeof fakeClient>) => {
  const users: (string | null)[] = [];
  const statuses: SyncStatus[] = [];
  const applied = vi.fn();
  const events: AccountEvents = {
    onUser: (email) => users.push(email),
    onSync: (status) => statuses.push(status),
    onApplied: applied,
  };
  const createClient = vi.fn(() => fake.client as unknown as SupabaseClient);
  const service = await startAccount(config, events, { createClient, debounceMs: 0 });
  running.push(service);
  return { service, users, statuses, applied, createClient };
};

const played: Progress = {
  ...emptyProgress(),
  points: 40,
  streak: 1,
  bestStreak: 1,
  lastPlayed: "2026-11-15",
  letters: { "english:a": { correct: 4, wrong: 0, box: 4 } },
};

const lastStatus = (statuses: SyncStatus[]) => statuses.at(-1);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

test("signed out: says so and touches no data", async () => {
  const fake = fakeClient();
  const { users, createClient } = await start(fake);
  expect(users).toEqual([null]);
  expect(fake.client.from).not.toHaveBeenCalled();
  expect(createClient).toHaveBeenCalledWith(
    config.url,
    config.key,
    expect.objectContaining({ auth: expect.objectContaining({ storageKey: config.storageKey }) })
  );
});

test("sending a code asks for a new or existing account, coming back to this site", async () => {
  const fake = fakeClient();
  const { service } = await start(fake);
  await expect(service.sendCode("kim@example.com")).resolves.toEqual({ ok: true });
  expect(fake.client.auth.signInWithOtp).toHaveBeenCalledWith({
    email: "kim@example.com",
    options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
  });
});

test("too many emails is reported as a rate limit", async () => {
  const fake = fakeClient({
    otpError: { message: "email rate limit exceeded", code: "over_email_send_rate_limit", status: 429 },
  });
  const { service } = await start(fake);
  await expect(service.sendCode("kim@example.com")).resolves.toEqual({
    ok: false,
    error: "rateLimit",
  });
});

test("first sign-in merges this browser's progress into the account and uploads it", async () => {
  saveProgress(played);
  const account: Progress = {
    ...emptyProgress(),
    points: 100,
    lastPlayed: "2026-11-10",
    streak: 2,
    bestStreak: 6,
    letters: { "english:b": { correct: 1, wrong: 1, box: 0 } },
  };
  const fake = fakeClient({ row: { progress: account, daily: null } });
  const { service, users, statuses, applied } = await start(fake);

  await expect(service.verifyCode("kim@example.com", "000000")).resolves.toEqual({
    ok: false,
    error: "badCode",
  });
  await expect(service.verifyCode("kim@example.com", "123456")).resolves.toEqual({ ok: true });
  expect(users).toEqual([null, "kim@example.com"]);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("synced"));

  const merged = loadProgress();
  expect(merged.points).toBe(100);
  expect(merged.bestStreak).toBe(6);
  expect(merged.lastPlayed).toBe("2026-11-15");
  expect(Object.keys(merged.letters).sort()).toEqual(["english:a", "english:b"]);
  expect(applied).toHaveBeenCalled();
  expect(fake.query.eq).toHaveBeenCalledWith("user_id", USER.id);
  expect(fake.state.upserts).toHaveLength(1);
  expect(fake.state.upserts[0]).toMatchObject({ user_id: USER.id, progress: merged });
});

test("a saved session syncs as the app starts, daily puzzle included", async () => {
  saveProgress(played);
  saveDaily("2026-11-15", "english", { read: ["cat"], write: [], rewarded: false });
  const fake = fakeClient({ signedIn: true });
  const { users, statuses } = await start(fake);
  expect(users).toEqual(["kim@example.com"]);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("synced"));
  expect(fake.state.upserts[0]).toMatchObject({
    progress: played,
    daily: { version: 1, day: "2026-11-15", courses: { english: { read: ["cat"] } } },
  });
});

test("playing while signed in sends the change", async () => {
  const fake = fakeClient({ signedIn: true });
  const { statuses } = await start(fake);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("synced"));
  const before = fake.state.upserts.length;
  saveProgress(played);
  await vi.waitFor(() => expect(fake.state.upserts.length).toBe(before + 1));
  expect(fake.state.upserts.at(-1)).toMatchObject({ progress: played });
});

test("offline: local progress is kept and the status says offline", async () => {
  saveProgress(played);
  const fake = fakeClient({
    signedIn: true,
    tableError: { message: "TypeError: Failed to fetch" },
  });
  const { statuses } = await start(fake);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("offline"));
  expect(loadProgress()).toEqual(played);
});

test("a refused request shows an error, and local progress is kept", async () => {
  saveProgress(played);
  const fake = fakeClient({
    signedIn: true,
    tableError: { message: "permission denied for table player_progress", code: "42501" },
  });
  const { statuses } = await start(fake);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("error"));
  expect(loadProgress()).toEqual(played);
});

test("a save refused for being too big shows an error, keeps local progress and is not retried in a loop", async () => {
  saveProgress(played);
  const fake = fakeClient({
    signedIn: true,
    upsertError: {
      message: 'new row for relation "player_progress" violates check constraint "player_progress_progress_limits"',
      code: "23514",
    },
  });
  const { statuses } = await start(fake);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("error"));
  expect(loadProgress()).toEqual(played);
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(fake.state.upserts).toHaveLength(1);
  expect(lastStatus(statuses)).toBe("error");
});

test("signing out signs out this device only and keeps local progress", async () => {
  saveProgress(played);
  const fake = fakeClient({ signedIn: true });
  const { service, users } = await start(fake);
  await service.signOut();
  expect(fake.client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  expect(users.at(-1)).toBeNull();
  expect(loadProgress()).toEqual(played);
});

test("deleting the account calls delete_account, signs out and keeps local progress", async () => {
  saveProgress(played);
  saveDaily("2026-11-15", "english", { read: ["cat"], write: [], rewarded: false });
  const fake = fakeClient({ signedIn: true });
  const { service, users, statuses } = await start(fake);
  await vi.waitFor(() => expect(lastStatus(statuses)).toBe("synced"));
  await expect(service.deleteAccount()).resolves.toEqual({ ok: true });
  expect(fake.client.rpc).toHaveBeenCalledWith("delete_account");
  expect(fake.client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  expect(users.at(-1)).toBeNull();
  expect(loadProgress()).toEqual(played);
  expect(loadDailyState()?.courses.english.read).toEqual(["cat"]);
});

test("a failed deletion stays signed in and says why", async () => {
  const fake = fakeClient({ signedIn: true, rpcError: { message: "Failed to fetch" } });
  const { service, users } = await start(fake);
  await expect(service.deleteAccount()).resolves.toEqual({ ok: false, error: "network" });
  expect(fake.client.auth.signOut).not.toHaveBeenCalled();
  expect(users.at(-1)).toBe("kim@example.com");
});

test("an expired sign-in link is reported and the address bar is cleaned", async () => {
  window.history.replaceState(
    null,
    "",
    "/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
  );
  const { service } = await start(fakeClient());
  expect(service.linkError).toBe("expiredLink");
  expect(window.location.hash).toBe("");
});

test("a token hash link is verified, then removed from the address bar", async () => {
  window.history.replaceState(null, "", "/?token_hash=abc&type=email");
  const fake = fakeClient();
  await start(fake);
  expect(fake.client.auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type: "email" });
  expect(window.location.search).toBe("");
});
