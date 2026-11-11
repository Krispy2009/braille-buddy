import type { Course, Lesson } from "../courses";
import { itemId, ItemId } from "./braille";
import { POINTS_PER_CORRECT, Progress } from "./progress";

/**
 * A letter counts as learnt once it reaches this review box, which takes two
 * right answers in a row. A lesson is finished when all its letters have.
 */
export const LEARNT_BOX = 2;

export type LessonState = "done" | "open" | "locked";

export const lessonItems = (course: Course, lesson: Lesson): ItemId[] =>
  lesson.letters.map((letter) => itemId(course.id, letter));

export const isLetterLearnt = (progress: Progress, item: ItemId): boolean =>
  (progress.letters[item]?.box ?? 0) >= LEARNT_BOX;

/** How many of a lesson's letters are learnt right now, for a progress bar. */
export const learntCount = (
  course: Course,
  lesson: Lesson,
  progress: Progress
): number =>
  lessonItems(course, lesson).filter((item) => isLetterLearnt(progress, item))
    .length;

const completed = (course: Course, progress: Progress): string[] =>
  progress.completedLessons[course.id] ?? [];

/**
 * One state per lesson, in course order. Finished lessons are "done" and stay
 * playable. The first unfinished lesson is "open". Everything after it is
 * "locked".
 */
export const lessonStates = (
  course: Course,
  progress: Progress
): LessonState[] => {
  const done = completed(course, progress);
  let openSeen = false;
  return course.lessons.map((lesson) => {
    if (done.includes(lesson.id)) return "done";
    if (openSeen) return "locked";
    openSeen = true;
    return "open";
  });
};

/**
 * Marks a lesson finished if all its letters are learnt. Returns the same
 * object when nothing changed, so callers can tell by identity.
 */
export const completeLesson = (
  course: Course,
  lesson: Lesson,
  progress: Progress
): Progress => {
  const done = completed(course, progress);
  if (
    done.includes(lesson.id) ||
    learntCount(course, lesson, progress) < lesson.letters.length
  ) {
    return progress;
  }
  return {
    ...progress,
    completedLessons: {
      ...progress.completedLessons,
      [course.id]: [...done, lesson.id],
    },
  };
};

/** Letters from every lesson that is done or open: what the player has met. */
export const metLetters = (course: Course, progress: Progress): string[] => {
  const states = lessonStates(course, progress);
  return course.lessons
    .filter((_, index) => states[index] !== "locked")
    .flatMap((lesson) => lesson.letters);
};

/** Points earned in one course. The stored total covers all courses. */
export const coursePoints = (course: Course, progress: Progress): number =>
  course.letters.reduce(
    (sum, { letter }) =>
      sum +
      (progress.letters[itemId(course.id, letter)]?.correct ?? 0) *
        POINTS_PER_CORRECT,
    0
  );
