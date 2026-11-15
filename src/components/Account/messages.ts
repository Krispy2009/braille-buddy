import type { AccountError, SyncStatus } from "../../account/types";

/** What each failure says. Plain, short, and always says what to do next. */
export const ERROR_TEXT: Record<AccountError, string> = {
  network: "Could not reach the server. Check your connection and try again.",
  rateLimit: "Too many emails were sent just now. Wait a few minutes, then try again.",
  badEmail: "That email address does not look right. Check it and try again.",
  badCode: "That code did not work. It may be mistyped or too old. Check it, or send a new code.",
  expiredLink: "That sign-in link has expired or was already used. Send yourself a new code.",
  unknown: "Something went wrong. Please try again.",
};

export const SYNC_TEXT: Record<SyncStatus, string> = {
  syncing: "Syncing…",
  synced: "Synced",
  offline: "Offline, will sync later",
  error: "Could not sync. Your progress is safe on this device and will sync later.",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const checkEmail = (email: string): string | undefined => {
  if (!email) return "Type your email address.";
  if (!EMAIL.test(email)) return ERROR_TEXT.badEmail;
  return undefined;
};

/** The code without spaces, or undefined if it cannot be one. */
export const cleanCode = (code: string): string | undefined => {
  const digits = code.replace(/[\s-]/g, "");
  return /^\d{6,10}$/.test(digits) ? digits : undefined;
};

export const CODE_ERROR = "Type the 6-digit code from the email.";
