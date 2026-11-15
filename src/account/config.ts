/**
 * Account settings, read from the build's environment (.env). Kept tiny and
 * free of Supabase code: it is part of the main bundle, and decides whether
 * the Supabase code (a separate chunk) needs loading at all. Players who
 * never sign in never download it.
 */

export type AccountConfig = {
  url: string;
  key: string;
  /** Where supabase-js keeps the session: "sb-<project ref>-auth-token". */
  storageKey: string;
};

export const accountConfig = (
  env: Record<string, string | boolean | undefined> = import.meta.env
): AccountConfig | null => {
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (typeof url !== "string" || typeof key !== "string" || !url || !key) return null;
  try {
    const ref = new URL(url).hostname.split(".")[0];
    return { url, key, storageKey: `sb-${ref}-auth-token` };
  } catch {
    return null;
  }
};

/** A session saved by an earlier sign-in on this device. */
export const hasStoredSession = (config: AccountConfig): boolean => {
  try {
    return Boolean(window.localStorage.getItem(config.storageKey));
  } catch {
    return false;
  }
};

const CALLBACK_PARAMS = ["access_token", "code", "token_hash", "error_description", "error_code"];

/**
 * The page was opened from a sign-in email: tokens or an error in the hash
 * (#access_token=...), or a code or token hash in the query (?code=...).
 */
export const isAuthCallback = (location: Pick<Location, "hash" | "search">): boolean => {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(location.search);
  return CALLBACK_PARAMS.some((name) => hash.has(name) || query.has(name));
};
