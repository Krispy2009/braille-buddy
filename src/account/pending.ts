/**
 * The email a code was just sent to, kept on this device for an hour. Going
 * to the mail app to read the code can close an installed app; coming back,
 * the Account screen opens on the code box again instead of starting over.
 */
const KEY = "braille-buddy:account-pending";
const HOUR = 60 * 60 * 1000;

export const loadPendingEmail = (now = Date.now()): string | undefined => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return undefined;
    const { email, sent } = data as { email?: unknown; sent?: unknown };
    if (typeof email !== "string" || typeof sent !== "number") return undefined;
    return now - sent < HOUR && now >= sent ? email : undefined;
  } catch {
    return undefined;
  }
};

export const savePendingEmail = (email: string, now = Date.now()) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ email, sent: now }));
  } catch {
    // Without storage the code box just does not survive a reload.
  }
};

export const clearPendingEmail = () => {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
};
