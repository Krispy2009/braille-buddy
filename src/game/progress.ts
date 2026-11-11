import type { ItemId } from "./braille";

export type LetterStats = {
  correct: number;
  wrong: number;
  /** Review box 0-4. 0 = needs lots of practice, 4 = well known. New letters start at 0. */
  box: number;
};

export type Progress = {
  version: 1;
  points: number;
  /** Consecutive days played. */
  streak: number;
  bestStreak: number;
  /** Local calendar day of the last answered question, "YYYY-MM-DD", or null. */
  lastPlayed: string | null;
  letters: Record<string, LetterStats>; // keyed by ItemId
  /**
   * Finished lesson ids, keyed by course id. Kept rather than worked out from
   * `letters`, so a later mistake never locks a lesson again.
   */
  completedLessons: Record<string, string[]>;
};

export const POINTS_PER_CORRECT = 10;
export const MAX_BOX = 4;
const STORAGE_KEY = "braille-buddy:progress";

export const emptyProgress = (): Progress => ({
  version: 1,
  points: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayed: null,
  letters: {},
  completedLessons: {},
});

const pad = (value: number, length: number): string =>
  String(value).padStart(length, "0");

/** Local calendar day "YYYY-MM-DD" for a Date (local time, not UTC). */
export const dayKey = (date: Date): string =>
  `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(
    date.getDate(),
    2
  )}`;

// Counting days through UTC midnights avoids daylight saving shifts, which
// make local days 23 or 25 hours long.
const dayNumber = (key: string): number => {
  const [year, month, day] = key.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / 86_400_000);
};

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDayKey = (value: unknown): value is string => {
  if (typeof value !== "string" || !DAY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const nextStreak = (progress: Progress, today: string): number => {
  if (progress.lastPlayed === null) return 1;
  const gap = dayNumber(today) - dayNumber(progress.lastPlayed);
  if (gap === 0) return Math.max(progress.streak, 1);
  if (gap === 1) return progress.streak + 1;
  return 1;
};

/** Returns new Progress (never mutates). */
export const recordAnswer = (
  progress: Progress,
  item: ItemId,
  correct: boolean,
  now: Date
): Progress => {
  const today = dayKey(now);
  const previous = progress.letters[item] ?? { correct: 0, wrong: 0, box: 0 };
  const stats: LetterStats = correct
    ? {
        correct: previous.correct + 1,
        wrong: previous.wrong,
        box: Math.min(previous.box + 1, MAX_BOX),
      }
    : { correct: previous.correct, wrong: previous.wrong + 1, box: 0 };
  const streak = nextStreak(progress, today);
  return {
    ...progress,
    points: progress.points + (correct ? POINTS_PER_CORRECT : 0),
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    lastPlayed: today,
    letters: { ...progress.letters, [item]: stats },
  };
};

/** The streak to DISPLAY today: it lapses once a whole day was missed. */
export const currentStreak = (progress: Progress, now: Date): number => {
  if (progress.lastPlayed === null) return 0;
  const gap = dayNumber(dayKey(now)) - dayNumber(progress.lastPlayed);
  return gap === 0 || gap === 1 ? progress.streak : 0;
};

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeLetters = (value: unknown): Record<string, LetterStats> => {
  const letters: Record<string, LetterStats> = {};
  if (!isRecord(value)) return letters;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "__proto__" || !isRecord(entry)) continue;
    const { correct, wrong, box } = entry;
    if (!isCount(correct) || !isCount(wrong) || !isCount(box)) continue;
    letters[key] = { correct, wrong, box: Math.min(box, MAX_BOX) };
  }
  return letters;
};

const sanitizeLessons = (value: unknown): Record<string, string[]> => {
  const lessons: Record<string, string[]> = {};
  if (!isRecord(value)) return lessons;
  for (const [key, entry] of Object.entries(value)) {
    if (key === "__proto__" || !Array.isArray(entry)) continue;
    lessons[key] = [
      ...new Set(entry.filter((id) => typeof id === "string")),
    ];
  }
  return lessons;
};

const defaultStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const loadProgress = (
  storage?: Pick<Storage, "getItem">
): Progress => {
  try {
    const source = storage ?? defaultStorage();
    const raw = source?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1) return emptyProgress();
    const { points, streak, bestStreak, lastPlayed } = data;
    if (!isCount(points) || !isCount(streak) || !isCount(bestStreak)) {
      return emptyProgress();
    }
    if (lastPlayed !== null && !isValidDayKey(lastPlayed)) {
      return emptyProgress();
    }
    return {
      version: 1,
      points,
      streak,
      bestStreak: Math.max(bestStreak, streak),
      lastPlayed,
      letters: sanitizeLetters(data.letters),
      // Missing in progress saved before lessons existed.
      completedLessons: sanitizeLessons(data.completedLessons),
    };
  } catch {
    return emptyProgress();
  }
};

/** Returns true if saved. Storage errors (private mode, quota) are swallowed. */
export const saveProgress = (
  progress: Progress,
  storage?: Pick<Storage, "setItem">
): boolean => {
  try {
    const target = storage ?? defaultStorage();
    if (!target) return false;
    target.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
};
