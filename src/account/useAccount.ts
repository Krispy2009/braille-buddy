import React from "react";
import { accountConfig, hasStoredSession, isAuthCallback } from "./config";
import type { AccountService } from "./supabaseAccount";
import type { AccountActions, AccountState, Result } from "./types";

const NOT_LOADED: Result = { ok: false, error: "network" };

/**
 * Account state for the whole app. The Supabase code is loaded only when
 * it is needed: when the Account screen opens, when this device already has
 * a session, or when the page was opened from a sign-in link.
 */
export const useAccount = (
  /** Called when sync saved merged progress here, so the app can reload it. */
  onApplied: () => void
): { state: AccountState; actions: AccountActions } => {
  const [config] = React.useState(() => accountConfig());
  const [state, setState] = React.useState<AccountState>(
    config ? { phase: "idle" } : { phase: "off" }
  );
  const service = React.useRef<Promise<AccountService> | null>(null);
  const appliedRef = React.useRef(onApplied);
  React.useEffect(() => {
    appliedRef.current = onApplied;
  }, [onApplied]);

  const load = React.useCallback((): Promise<AccountService> => {
    if (!config) return Promise.reject(new Error("Accounts are off"));
    if (service.current) return service.current;
    setState((previous) =>
      previous.phase === "idle" || previous.phase === "unavailable"
        ? { phase: "loading" }
        : previous
    );
    const loading = import("./supabaseAccount")
      .then(({ startAccount }) =>
        startAccount(config, {
          onUser: (email) =>
            setState((previous) =>
              email === null
                ? { phase: "signedOut" }
                : {
                    phase: "signedIn",
                    email,
                    sync: previous.phase === "signedIn" ? previous.sync : null,
                  }
            ),
          onSync: (sync) =>
            setState((previous) =>
              previous.phase === "signedIn" ? { ...previous, sync } : previous
            ),
          onApplied: () => appliedRef.current(),
        })
      )
      .then((started) => {
        const linkError = started.linkError;
        if (linkError) {
          setState((previous) =>
            previous.phase === "signedOut" ? { phase: "signedOut", linkError } : previous
          );
        }
        return started;
      });
    service.current = loading;
    loading.catch(() => {
      service.current = null;
      setState({ phase: "unavailable" });
    });
    return loading;
  }, [config]);

  React.useEffect(() => {
    if (config && (hasStoredSession(config) || isAuthCallback(window.location))) {
      load().catch(() => {});
    }
  }, [config, load]);

  const actions = React.useMemo<AccountActions>(() => {
    const call =
      <Args extends unknown[]>(
        pick: (started: AccountService) => (...args: Args) => Promise<Result>
      ) =>
      async (...args: Args): Promise<Result> => {
        try {
          return await pick(await load())(...args);
        } catch {
          return NOT_LOADED;
        }
      };
    return {
      load: () => void load().catch(() => {}),
      sendCode: call((started) => started.sendCode),
      verifyCode: call((started) => started.verifyCode),
      signOut: call((started) => started.signOut),
      deleteAccount: call((started) => started.deleteAccount),
      syncNow: () => void load().then((started) => started.syncNow(), () => {}),
    };
  }, [load]);

  return { state, actions };
};
