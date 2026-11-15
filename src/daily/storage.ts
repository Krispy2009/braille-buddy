import type { Language } from "../game/braille";
import { attemptsFor, dailyPuzzle, halfResult, MAX_TRIES, resultText } from "./daily";

/**
 * One course's daily puzzle as played so far. Only the tries are kept;
 * whether each was right, the hints and the result are worked out again from
 * them and the day's words.
 */
export type DailyRecord = {
  /** Typed words, already normalised. */
  read: string[];
  /** Written words, each as `cellsToGuess` gives it: "100100 100000". */
  write: string[];
  /** Points and streak were given for finishing, so never again today. */
  rewarded: boolean;
};

/**
 * Kept under its own key, apart from progress, so nothing here can break
 * saved progress. Only one day is kept: a new day replaces the old one, so
 * the key never grows. Courses have a puzzle each.
 */
const STORAGE_KEY = "braille-buddy:daily";
const VERSION = 1;

export const emptyRecord = (): DailyRecord => ({ read: [], write: [], rewarded: false });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const WRITTEN = /^[01]{6}( [01]{6})*$/;

const tries = (value: unknown, valid: (item: string) => boolean): string[] | undefined =>
  Array.isArray(value) &&
  value.length <= MAX_TRIES &&
  value.every((item) => typeof item === "string" && valid(item))
    ? (value as string[])
    : undefined;

const sanitize = (value: unknown): DailyRecord | undefined => {
  if (!isRecord(value)) return undefined;
  const read = tries(value.read, () => true);
  const write = tries(value.write, (item) => WRITTEN.test(item));
  if (!read || !write || typeof value.rewarded !== "boolean") return undefined;
  return { read, write, rewarded: value.rewarded };
};

const defaultStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

type Saved = { day: string; courses: Record<string, unknown> };

const readSaved = (storage?: Pick<Storage, "getItem">): Saved | undefined => {
  try {
    const raw = (storage ?? defaultStorage())?.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== VERSION) return undefined;
    if (typeof data.day !== "string" || !isRecord(data.courses)) return undefined;
    return { day: data.day, courses: data.courses };
  } catch {
    return undefined;
  }
};

/** The record for a day and course; empty if none was saved or it is broken. */
export const loadDaily = (
  day: string,
  course: Language,
  storage?: Pick<Storage, "getItem">
): DailyRecord => {
  const saved = readSaved(storage);
  if (!saved || saved.day !== day || !Object.hasOwn(saved.courses, course)) {
    return emptyRecord();
  }
  return sanitize(saved.courses[course]) ?? emptyRecord();
};

/** Returns true if saved. Storage errors (private mode, quota) are swallowed. */
export const saveDaily = (
  day: string,
  course: Language,
  record: DailyRecord,
  storage?: Pick<Storage, "getItem" | "setItem">
): boolean => {
  try {
    const target = storage ?? defaultStorage();
    if (!target) return false;
    const saved = readSaved(target);
    const courses = saved?.day === day ? { ...saved.courses } : {};
    courses[course] = record;
    target.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, day, courses }));
    return true;
  } catch {
    return false;
  }
};

/** What Home shows about today's puzzle, or undefined for a course without one. */
export type DailyStatus = {
  done: boolean;
  /** Some tries made, but not finished. */
  started: boolean;
  /** "Read it in 1 try, Write it in 2 tries", once done. */
  result?: string;
};

export const dailyStatus = (
  course: Language,
  now: Date,
  storage?: Pick<Storage, "getItem">
): DailyStatus | undefined => {
  const puzzle = dailyPuzzle(course, now);
  if (!puzzle) return undefined;
  const record = loadDaily(puzzle.day, course, storage);
  const attempts = attemptsFor(puzzle, record);
  const read = halfResult(attempts.read);
  const write = halfResult(attempts.write);
  const done = read.finished && write.finished;
  return {
    done,
    started: !done && record.read.length + record.write.length > 0,
    result: done ? resultText(read, write) : undefined,
  };
};
