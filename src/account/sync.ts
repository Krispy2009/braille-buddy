import { mergeSnapshots, sameSnapshot, Snapshot, stableJson } from "./merge";

/**
 * Keeps this device's progress and the account's copy in step. Local first:
 * the game only ever reads localStorage, and this only adds to it. A sync
 * downloads the account's copy, merges it with the local one, saves the
 * result here if it changed, and uploads it if the account's copy differs.
 * Every sync is a full merge, so a sync that fails or never happens loses
 * nothing: the next one catches up.
 */

export type SyncStatus = "syncing" | "synced" | "offline" | "error";

export type Remote = {
  /** The account's copy, or null if it has none yet. Throws on failure. */
  pull: () => Promise<Snapshot | null>;
  /** Replaces the account's copy. Throws on failure. */
  push: (snapshot: Snapshot) => Promise<void>;
};

export type Local = {
  read: () => Snapshot;
  write: (snapshot: Snapshot) => void;
};

export type SyncOptions = {
  remote: Remote;
  local: Local;
  onStatus: (status: SyncStatus) => void;
  /** Called after merged progress was saved here, so screens can show it. */
  onApplied?: (snapshot: Snapshot) => void;
  isOnline?: () => boolean;
  /** How long to wait after a change before uploading, to batch answers. */
  debounceMs?: number;
};

export type Sync = {
  /** Syncs now. Never rejects: problems end up in the status. */
  syncNow: () => Promise<void>;
  /** A local change: syncs after a short pause, unless it was already synced. */
  schedule: () => void;
  /** Syncs now if a scheduled sync is waiting (the page is being hidden). */
  flush: () => Promise<void>;
  /** Stops for good (sign out). A sync already running finishes quietly. */
  stop: () => void;
};

const NETWORK_ERROR = /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet_disconnected/i;

/** A request that never reached the server, as opposed to one it refused. */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  return NETWORK_ERROR.test(message);
};

const defaultOnline = () =>
  typeof navigator === "undefined" || navigator.onLine !== false;

export const createSync = ({
  remote,
  local,
  onStatus,
  onApplied,
  isOnline = defaultOnline,
  debounceMs = 2000,
}: SyncOptions): Sync => {
  let stopped = false;
  let running: Promise<void> | null = null;
  let again = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The last snapshot both sides agreed on, as stable JSON. */
  let lastSynced: string | null = null;

  const status = (next: SyncStatus) => {
    if (!stopped) onStatus(next);
  };

  const once = async () => {
    if (!isOnline()) {
      status("offline");
      return;
    }
    status("syncing");
    try {
      const remoteCopy = await remote.pull();
      if (stopped) return;
      const localCopy = local.read();
      const merged = remoteCopy ? mergeSnapshots(localCopy, remoteCopy) : mergeSnapshots(localCopy, localCopy);
      if (!sameSnapshot(merged, localCopy)) {
        local.write(merged);
        onApplied?.(merged);
      }
      if (!remoteCopy || !sameSnapshot(merged, remoteCopy)) {
        await remote.push(merged);
      }
      lastSynced = stableJson(merged);
      status("synced");
    } catch (error) {
      status(isNetworkError(error) || !isOnline() ? "offline" : "error");
    }
  };

  const syncNow = (): Promise<void> => {
    if (stopped) return Promise.resolve();
    clearTimeout(timer);
    timer = undefined;
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        await once();
      } while (again && !stopped);
    })().finally(() => {
      running = null;
    });
    return running;
  };

  const schedule = () => {
    if (stopped) return;
    try {
      // Saving merged progress also signals a change: nothing new to send.
      if (lastSynced !== null && stableJson(local.read()) === lastSynced) return;
    } catch {
      // Reading failed; let the sync itself find out.
    }
    clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), debounceMs);
  };

  const flush = () => (timer === undefined ? Promise.resolve() : syncNow());

  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    timer = undefined;
  };

  return { syncNow, schedule, flush, stop };
};
