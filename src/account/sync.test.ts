import { emptyProgress, Progress } from "../game/progress";
import type { Snapshot } from "./merge";
import { createSync, isNetworkError, Remote, SyncStatus } from "./sync";

const snapshot = (overrides: Partial<Progress> = {}): Snapshot => ({
  progress: { ...emptyProgress(), ...overrides },
  daily: null,
});

/** A local copy kept in memory, and a remote that records what it was sent. */
const setup = (local: Snapshot, remoteCopy: Snapshot | null, remote: Partial<Remote> = {}) => {
  let stored = local;
  const pushed: Snapshot[] = [];
  const statuses: SyncStatus[] = [];
  const applied = vi.fn();
  let online = true;
  const sync = createSync({
    local: { read: () => stored, write: (next) => (stored = next) },
    remote: {
      pull: vi.fn(async () => remoteCopy),
      push: vi.fn(async (next: Snapshot) => {
        pushed.push(next);
        remoteCopy = next;
      }),
      ...remote,
    },
    onStatus: (status) => statuses.push(status),
    onApplied: applied,
    isOnline: () => online,
    debounceMs: 1000,
  });
  return {
    sync,
    pushed,
    statuses,
    applied,
    local: () => stored,
    setLocal: (next: Snapshot) => (stored = next),
    goOffline: () => (online = false),
  };
};

test("first sync uploads this browser's progress to an empty account", async () => {
  const local = snapshot({ points: 50, lastPlayed: "2026-11-15", streak: 1, bestStreak: 1 });
  const { sync, pushed, statuses, applied } = setup(local, null);
  await sync.syncNow();
  expect(pushed).toHaveLength(1);
  expect(pushed[0].progress.points).toBe(50);
  expect(applied).not.toHaveBeenCalled();
  expect(statuses).toEqual(["syncing", "synced"]);
});

test("a sync merges both copies, saves the result here and uploads it", async () => {
  const local = snapshot({ points: 50, letters: { "english:a": { correct: 1, wrong: 0, box: 1 } } });
  const remote = snapshot({ points: 80, letters: { "english:b": { correct: 2, wrong: 0, box: 2 } } });
  const { sync, pushed, applied, local: stored } = setup(local, remote);
  await sync.syncNow();
  expect(stored().progress.points).toBe(80);
  expect(Object.keys(stored().progress.letters)).toEqual(["english:a", "english:b"]);
  expect(applied).toHaveBeenCalledTimes(1);
  expect(pushed[0]).toEqual(stored());
});

test("nothing is uploaded or saved when both copies already agree", async () => {
  const both = snapshot({ points: 10 });
  const { sync, pushed, applied, statuses } = setup(both, both);
  await sync.syncNow();
  expect(pushed).toHaveLength(0);
  expect(applied).not.toHaveBeenCalled();
  expect(statuses.at(-1)).toBe("synced");
});

test("offline: nothing is sent, local progress is kept, and the status says so", async () => {
  const local = snapshot({ points: 50 });
  const pull = vi.fn(async () => snapshot());
  const { sync, statuses, local: stored, goOffline } = setup(local, null, { pull });
  goOffline();
  await sync.syncNow();
  expect(pull).not.toHaveBeenCalled();
  expect(stored()).toBe(local);
  expect(statuses).toEqual(["offline"]);
});

test("a network failure keeps local progress and says offline, never throws", async () => {
  const local = snapshot({ points: 50 });
  const pull = vi.fn(async () => {
    throw new TypeError("Failed to fetch");
  });
  const { sync, statuses, local: stored } = setup(local, null, { pull });
  await expect(sync.syncNow()).resolves.toBeUndefined();
  expect(stored()).toBe(local);
  expect(statuses).toEqual(["syncing", "offline"]);
});

test("a server error is shown as an error, and local progress stays", async () => {
  const local = snapshot({ points: 50 });
  const push = vi.fn(async () => {
    throw { message: "permission denied for table player_progress", code: "42501" };
  });
  const { sync, statuses, local: stored } = setup(local, null, { push });
  await sync.syncNow();
  expect(stored().progress.points).toBe(50);
  expect(statuses).toEqual(["syncing", "error"]);
});

describe("scheduled syncs", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("a local change is sent after a pause, batching several changes", async () => {
    const { sync, pushed, setLocal } = setup(snapshot(), null);
    await sync.syncNow();
    expect(pushed).toHaveLength(1);
    setLocal(snapshot({ points: 10 }));
    sync.schedule();
    setLocal(snapshot({ points: 20 }));
    sync.schedule();
    await vi.advanceTimersByTimeAsync(999);
    expect(pushed).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(pushed).toHaveLength(2);
    expect(pushed[1].progress.points).toBe(20);
  });

  test("saving merged progress does not trigger another upload", async () => {
    const { sync, pushed } = setup(snapshot({ points: 5 }), snapshot({ points: 9 }));
    await sync.syncNow();
    const before = pushed.length;
    sync.schedule();
    await vi.advanceTimersByTimeAsync(5000);
    expect(pushed).toHaveLength(before);
  });

  test("flush sends a waiting change straight away", async () => {
    const { sync, pushed, setLocal } = setup(snapshot(), null);
    await sync.syncNow();
    setLocal(snapshot({ points: 10 }));
    sync.schedule();
    await sync.flush();
    expect(pushed.at(-1)!.progress.points).toBe(10);
  });

  test("nothing runs after stop", async () => {
    const pull = vi.fn(async () => null);
    const { sync, setLocal } = setup(snapshot(), null, { pull });
    setLocal(snapshot({ points: 1 }));
    sync.schedule();
    sync.stop();
    await vi.advanceTimersByTimeAsync(5000);
    await sync.syncNow();
    expect(pull).not.toHaveBeenCalled();
  });
});

test("a sync asked for while one runs runs once more after it", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  let calls = 0;
  const pull = vi.fn(async () => {
    calls += 1;
    if (calls === 1) await gate;
    return null;
  });
  const { sync } = setup(snapshot(), null, { pull });
  const first = sync.syncNow();
  const second = sync.syncNow();
  release();
  await Promise.all([first, second]);
  expect(pull).toHaveBeenCalledTimes(2);
});

test("isNetworkError tells a lost connection from a refused request", () => {
  expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  expect(isNetworkError({ message: "TypeError: NetworkError when attempting to fetch resource." })).toBe(true);
  expect(isNetworkError({ message: "Load failed" })).toBe(true);
  expect(isNetworkError({ message: "JWT expired", code: "PGRST301" })).toBe(false);
});
