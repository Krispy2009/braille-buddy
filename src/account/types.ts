import type { SyncStatus } from "./sync";

export type { SyncStatus };

/** Why an account action failed, in words the screen turns into a message. */
export type AccountError =
  | "network"
  | "rateLimit"
  | "badEmail"
  | "badCode"
  | "expiredLink"
  | "unknown";

export type Result = { ok: true } | { ok: false; error: AccountError };

/** What the Account screen shows. */
export type AccountState =
  /** Accounts are not set up in this build: nothing about them is shown. */
  | { phase: "off" }
  /** The account code has not been loaded yet (most players, always). */
  | { phase: "idle" }
  | { phase: "loading" }
  /** The account code could not be loaded, usually because of no connection. */
  | { phase: "unavailable" }
  /** linkError: the sign-in link the page opened from did not work. */
  | { phase: "signedOut"; linkError?: AccountError }
  /** sync is null until the first sync starts. */
  | { phase: "signedIn"; email: string; sync: SyncStatus | null };

export type AccountActions = {
  /** Loads the account code, if it is not loaded already. */
  load: () => void;
  sendCode: (email: string) => Promise<Result>;
  verifyCode: (email: string, code: string) => Promise<Result>;
  signOut: () => Promise<Result>;
  deleteAccount: () => Promise<Result>;
  syncNow: () => void;
};
