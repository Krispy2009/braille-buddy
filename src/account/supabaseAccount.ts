// The account code: Supabase sign-in, sign-out, deletion and progress sync.
// Only ever loaded with import(), so it and supabase-js are a separate
// chunk that players without an account never download.
import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  dailyStateData,
  loadDailyState,
  parseDailyState,
  saveDailyState,
} from "../daily/storage";
import { onLocalChange } from "../game/localChanges";
import { loadProgress, parseProgress, saveProgress } from "../game/progress";
import type { Database } from "./database.types";
import type { AccountConfig } from "./config";
import { isAuthCallback } from "./config";
import type { Snapshot } from "./merge";
import { createSync, isNetworkError, Local, Remote, Sync, SyncStatus } from "./sync";
import type { AccountError, Result } from "./types";

export const TABLE = "player_progress";

export type AccountEvents = {
  /** The signed-in email, or null when signed out. */
  onUser: (email: string | null) => void;
  onSync: (status: SyncStatus) => void;
  /** Merged progress was saved on this device. */
  onApplied: () => void;
};

export type AccountService = {
  /** Set when the page opened from a sign-in link that did not work. */
  linkError: AccountError | null;
  sendCode: (email: string) => Promise<Result>;
  verifyCode: (email: string, code: string) => Promise<Result>;
  signOut: () => Promise<Result>;
  deleteAccount: () => Promise<Result>;
  syncNow: () => void;
  /** Stops syncing and listening. The app never needs it; tests do. */
  dispose: () => void;
};

type Options = {
  createClient?: (url: string, key: string, options: object) => SupabaseClient<Database>;
  win?: Window;
  debounceMs?: number;
};

type ErrorLike = { code?: unknown; status?: unknown; name?: unknown; message?: unknown };

export const accountError = (error: unknown): AccountError => {
  const { code, status, name } = (error ?? {}) as ErrorLike;
  if (name === "AuthRetryableFetchError" || isNetworkError(error)) return "network";
  if (status === 429 || (typeof code === "string" && code.includes("rate_limit"))) {
    return "rateLimit";
  }
  if (code === "otp_expired" || code === "otp_disabled") return "badCode";
  if (code === "email_address_invalid" || code === "validation_failed") return "badEmail";
  return "unknown";
};

const fail = (error: unknown): Result => ({ ok: false, error: accountError(error) });

/** The account's copy of progress: one row per player, readable only by them. */
export const supabaseRemote = (client: SupabaseClient<Database>, userId: string): Remote => ({
  pull: async () => {
    const { data, error } = await client
      .from(TABLE)
      .select("progress, daily")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { progress: parseProgress(data.progress), daily: parseDailyState(data.daily) };
  },
  push: async (snapshot: Snapshot) => {
    const { error } = await client.from(TABLE).upsert({
      user_id: userId,
      progress: snapshot.progress,
      daily: snapshot.daily && dailyStateData(snapshot.daily),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },
});

export const browserLocal: Local = {
  read: () => ({ progress: loadProgress(), daily: loadDailyState() }),
  write: (snapshot) => {
    saveProgress(snapshot.progress);
    if (snapshot.daily) saveDailyState(snapshot.daily);
  },
};

const AUTH_PARAMS = [
  "access_token", "refresh_token", "expires_in", "expires_at", "token_type", "type",
  "code", "token_hash", "error", "error_code", "error_description", "provider_token",
];

/** The error a sign-in link came back with, such as an expired link. */
const linkErrorIn = (location: Location): AccountError | null => {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(location.search);
  const code = params.get("error_code") ?? query.get("error_code");
  if (!code && !params.get("error") && !query.get("error")) return null;
  return code === "otp_expired" ? "expiredLink" : "unknown";
};

/** Takes sign-in tokens and codes out of the address bar once used. */
const cleanUrl = (win: Window) => {
  const url = new URL(win.location.href);
  for (const name of AUTH_PARAMS) url.searchParams.delete(name);
  url.hash = "";
  try {
    win.history.replaceState(win.history.state, "", url.pathname + url.search);
  } catch {
    // Not allowed in some sandboxes; the tokens are already used.
  }
};

export const startAccount = async (
  config: AccountConfig,
  events: AccountEvents,
  {
    createClient = supabaseCreateClient<Database>,
    win = window,
    debounceMs,
  }: Options = {}
): Promise<AccountService> => {
  const fromLink = isAuthCallback(win.location);
  let linkError = fromLink ? linkErrorIn(win.location) : null;
  const tokenHash = new URLSearchParams(win.location.search).get("token_hash");

  const client = createClient(config.url, config.key, {
    auth: {
      storageKey: config.storageKey,
      persistSession: true,
      autoRefreshToken: true,
      // The link in the email signs in this browser through the URL hash.
      // Implicit rather than PKCE so a link opened in another browser (a mail
      // app's own browser, say) still works there.
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  });

  let userId: string | null = null;
  let sync: Sync | null = null;
  let stopListening: (() => void) | null = null;

  const stopSync = () => {
    sync?.stop();
    stopListening?.();
    sync = null;
    stopListening = null;
  };

  const startSync = (id: string) => {
    const current = createSync({
      remote: supabaseRemote(client, id),
      local: browserLocal,
      onStatus: events.onSync,
      onApplied: () => events.onApplied(),
      debounceMs,
    });
    sync = current;
    stopListening = onLocalChange(() => current.schedule());
    void current.syncNow();
  };

  const setSession = (session: Session | null) => {
    const user = session?.user ?? null;
    if ((user?.id ?? null) !== userId) {
      stopSync();
      userId = user?.id ?? null;
      events.onUser(user ? (user.email ?? "") : null);
      if (userId) startSync(userId);
    }
  };

  // Called inside supabase-js's own lock: never call back into it from here
  // directly, or it waits for itself.
  let disposed = false;
  const { data: auth } = client.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      if (!disposed) setSession(session);
    }, 0);
  });

  // A link made from {{ .TokenHash }} instead of the default one.
  if (tokenHash) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (error) linkError = error.code === "otp_expired" ? "expiredLink" : accountError(error);
  }

  const { data, error } = await client.auth.getSession();
  if (error && fromLink && !linkError) linkError = "unknown";
  if (fromLink) cleanUrl(win);
  setSession(data?.session ?? null);
  if (!userId) events.onUser(null);

  // Catch up when the player comes back to the tab or the connection returns,
  // and send anything waiting when the page is hidden or closed.
  const onVisibility = () => {
    if (win.document.visibilityState === "visible") void sync?.syncNow();
    else void sync?.flush();
  };
  const onOnline = () => void sync?.syncNow();
  const onPageHide = () => void sync?.flush();
  win.document.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("online", onOnline);
  win.addEventListener("pagehide", onPageHide);

  return {
    get linkError() {
      return linkError;
    },
    sendCode: async (email) => {
      try {
        const { error } = await client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: win.location.origin, shouldCreateUser: true },
        });
        return error ? fail(error) : { ok: true };
      } catch (error) {
        return fail(error);
      }
    },
    verifyCode: async (email, code) => {
      try {
        const { data, error } = await client.auth.verifyOtp({ email, token: code, type: "email" });
        if (error) return fail(error);
        linkError = null;
        setSession(data.session);
        return { ok: true };
      } catch (error) {
        return fail(error);
      }
    },
    signOut: async () => {
      // Send any change still waiting, then sign out of this device only.
      await sync?.flush();
      stopSync();
      try {
        await client.auth.signOut({ scope: "local" });
      } catch {
        // The session is removed from this device before the request.
      }
      setSession(null);
      return { ok: true };
    },
    deleteAccount: async () => {
      const id = userId;
      // No sync may run while the row is being deleted, or it could be sent again.
      stopSync();
      try {
        const { error } = await client.rpc("delete_account");
        if (error) {
          if (id) startSync(id);
          return fail(error);
        }
      } catch (error) {
        if (id) startSync(id);
        return fail(error);
      }
      try {
        await client.auth.signOut({ scope: "local" });
      } catch {
        // The user is gone; the local session is removed either way.
      }
      setSession(null);
      return { ok: true };
    },
    syncNow: () => void sync?.syncNow(),
    dispose: () => {
      disposed = true;
      stopSync();
      auth.subscription.unsubscribe();
      win.document.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("online", onOnline);
      win.removeEventListener("pagehide", onPageHide);
    },
  };
};
