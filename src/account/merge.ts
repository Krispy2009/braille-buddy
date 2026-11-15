import { attemptsFor, halfResult, puzzleForDay } from "../daily/daily";
import type { DailyRecord, DailyState } from "../daily/storage";
import type { Language } from "../game/braille";
import type { LetterStats, Progress } from "../game/progress";

/*
 * Merging two copies of a player's progress: this browser's and the one saved
 * with their account, or two devices that played apart. Used for the first
 * sign-in (the browser's progress is merged into the account, never thrown
 * away) and for every sync after.
 *
 * Every rule picks or combines values so that:
 * - merge(a, b) equals merge(b, a) (commutative), so it does not matter
 *   which device syncs first;
 * - merge(a, merge(a, b)) equals merge(a, b) (idempotent), so syncing again
 *   changes nothing;
 * - nothing anyone earned goes backwards.
 *
 * The rules:
 * - letters: per letter, the record with more attempts (correct + wrong),
 *   as it has seen more practice. On a tie, the higher review box, then more
 *   correct answers. Mixing two records would count some answers twice.
 * - points: the larger. Adding would count shared points twice, since both
 *   copies usually started from the same synced total. Points earned on two
 *   devices that were both offline at once are not added together.
 * - streak and lastPlayed: from the copy played most recently. On the same
 *   day, the longer streak.
 * - bestStreak: the largest of both and of the merged streak.
 * - completedLessons: every lesson finished on either, per course, sorted.
 */

const attempts = (stats: LetterStats) => stats.correct + stats.wrong;

/** Positive if a should win, negative if b should, 0 if they are equal. */
const compareLetters = (a: LetterStats, b: LetterStats): number =>
  attempts(a) - attempts(b) || a.box - b.box || a.correct - b.correct;

const mergeLetters = (
  a: Record<string, LetterStats>,
  b: Record<string, LetterStats>
): Record<string, LetterStats> => {
  const merged: Record<string, LetterStats> = {};
  for (const id of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const left = Object.hasOwn(a, id) ? a[id] : undefined;
    const right = Object.hasOwn(b, id) ? b[id] : undefined;
    const winner =
      left && right ? (compareLetters(left, right) >= 0 ? left : right) : (left ?? right)!;
    merged[id] = { ...winner };
  }
  return merged;
};

const mergeLessons = (
  a: Record<string, string[]>,
  b: Record<string, string[]>
): Record<string, string[]> => {
  const merged: Record<string, string[]> = {};
  for (const course of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const left = Object.hasOwn(a, course) ? a[course] : [];
    const right = Object.hasOwn(b, course) ? b[course] : [];
    merged[course] = [...new Set([...left, ...right])].sort();
  }
  return merged;
};

/** Days as "YYYY-MM-DD" sort as text; null (never played) is earliest. */
const laterDay = (a: string | null, b: string | null): number => {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a > b ? 1 : -1;
};

export const mergeProgress = (a: Progress, b: Progress): Progress => {
  const order = laterDay(a.lastPlayed, b.lastPlayed);
  const streak =
    order > 0 ? a.streak : order < 0 ? b.streak : Math.max(a.streak, b.streak);
  return {
    version: 1,
    points: Math.max(a.points, b.points),
    streak,
    bestStreak: Math.max(a.bestStreak, b.bestStreak, streak),
    lastPlayed: order >= 0 ? a.lastPlayed : b.lastPlayed,
    letters: mergeLetters(a.letters, b.letters),
    completedLessons: mergeLessons(a.completedLessons, b.completedLessons),
  };
};

/*
 * The daily puzzle. Only one day is kept, so a copy from an older day is
 * simply replaced by the newer one. On the same day, each course's record
 * is merged on its own:
 * - Tries are never mixed: two devices' guesses together could add up to
 *   more than the puzzle allows. One record is kept whole: a finished one
 *   over an unfinished one, then the one with more tries, then (for a tie)
 *   a fixed order, so both devices pick the same.
 * - rewarded is true if either copy was rewarded, so finishing the puzzle on
 *   a second device never gives its points twice.
 */

const isFinished = (course: string, day: string, record: DailyRecord): boolean => {
  const puzzle = puzzleForDay(course as Language, day);
  if (!puzzle) return false;
  const result = attemptsFor(puzzle, record);
  return halfResult(result.read).finished && halfResult(result.write).finished;
};

const triesOf = (record: DailyRecord) => record.read.length + record.write.length;

const tieBreak = (record: DailyRecord) => JSON.stringify([record.read, record.write]);

const mergeRecord = (
  course: string,
  day: string,
  a: DailyRecord,
  b: DailyRecord
): DailyRecord => {
  const score =
    Number(isFinished(course, day, a)) - Number(isFinished(course, day, b)) ||
    triesOf(a) - triesOf(b) ||
    (tieBreak(a) > tieBreak(b) ? 1 : tieBreak(a) < tieBreak(b) ? -1 : 0);
  const winner = score >= 0 ? a : b;
  return {
    read: [...winner.read],
    write: [...winner.write],
    rewarded: a.rewarded || b.rewarded,
  };
};

export const mergeDaily = (
  a: DailyState | null,
  b: DailyState | null
): DailyState | null => {
  if (!a || !b) {
    const only = a ?? b;
    return only && { day: only.day, courses: sortedCourses(only.courses) };
  }
  if (a.day !== b.day) {
    const newer = a.day > b.day ? a : b;
    return { day: newer.day, courses: sortedCourses(newer.courses) };
  }
  const courses: Record<string, DailyRecord> = {};
  for (const course of [...new Set([...Object.keys(a.courses), ...Object.keys(b.courses)])].sort()) {
    const left = Object.hasOwn(a.courses, course) ? a.courses[course] : undefined;
    const right = Object.hasOwn(b.courses, course) ? b.courses[course] : undefined;
    courses[course] =
      left && right ? mergeRecord(course, a.day, left, right) : { ...(left ?? right)! };
  }
  return { day: a.day, courses };
};

const sortedCourses = (courses: Record<string, DailyRecord>) => {
  const sorted: Record<string, DailyRecord> = {};
  for (const course of Object.keys(courses).sort()) sorted[course] = { ...courses[course] };
  return sorted;
};

/** What sync keeps in step: progress and the daily puzzle. Settings stay on each device. */
export type Snapshot = { progress: Progress; daily: DailyState | null };

export const mergeSnapshots = (a: Snapshot, b: Snapshot): Snapshot => ({
  progress: mergeProgress(a.progress, b.progress),
  daily: mergeDaily(a.daily, b.daily),
});

/** JSON with object keys sorted, so equal snapshots always compare equal. */
export const stableJson = (value: unknown): string =>
  JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(
          Object.entries(inner as Record<string, unknown>).sort(([x], [y]) =>
            x < y ? -1 : x > y ? 1 : 0
          )
        )
      : inner
  );

export const sameSnapshot = (a: Snapshot, b: Snapshot): boolean =>
  stableJson(a) === stableJson(b);
