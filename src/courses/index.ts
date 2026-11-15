/**
 * A course is one language's braille alphabet plus the order it is taught in.
 * Adding a language means adding a JSON file to this folder: nothing else in
 * the code needs to change. `courses.test.ts` checks every file's shape.
 */

/** What an entry is, for wording such as "Write the letter a" or "Write number 7". */
export type EntryKind = "letter" | "number" | "punctuation";

type EntryBase = {
  /**
   * The print form: a letter, a letter pair written with one cell such as
   * "ου", a digit such as "7", or a punctuation mark such as "?". It is the
   * entry's id in lessons and in saved progress ("english:a"), so never
   * change it once released.
   */
  letter: string;
  /** Leave out for a letter. */
  kind?: EntryKind;
  /**
   * How a screen reader should say the entry, when the print form isn't read
   * well ("alpha", "number 7", "question mark").
   */
  spoken?: string;
};

/**
 * One thing to learn. Written with one cell (`dots`) or, like a number with
 * its number sign, with several cells in order (`cells`). Use `entryCells`
 * to read either form.
 */
export type CourseLetter = EntryBase &
  (
    | {
        /** Raised dots, 1 to 6, in ascending order. */
        dots: number[];
        cells?: never;
      }
    | {
        /** Two or more cells, each its raised dots in ascending order. */
        cells: number[][];
        dots?: never;
      }
  );

/** Every cell of an entry, in order: one for a letter, two for "7". */
export const entryCells = (entry: CourseLetter): number[][] =>
  entry.cells ?? [entry.dots];

export const entryKind = (entry: CourseLetter): EntryKind =>
  entry.kind ?? "letter";

export type Lesson = {
  id: string;
  title: string;
  /**
   * The entries this lesson introduces, by their print form. Each entry
   * belongs to one lesson.
   */
  letters: string[];
};

export type Course = {
  /** Stable id, used in saved progress. Never rename it. */
  id: string;
  /** Shown to the player, in the interface language. */
  name: string;
  /** BCP 47 tag for the `lang` attribute on this course's letters. */
  lang: string;
  /** Letters first, then numbers and punctuation. */
  letters: CourseLetter[];
  /**
   * The number sign that starts every number entry (dots 3456 in UEB and in
   * Greek braille). Required once a course has numbers.
   */
  numberSign?: number[];
  lessons: Lesson[];
};

const files = import.meta.glob<Course>("./*.json", {
  eager: true,
  import: "default",
});

export const COURSES: readonly Course[] = Object.keys(files)
  .sort()
  .map((path) => files[path]);

export const findCourse = (id: string): Course | undefined =>
  COURSES.find((course) => course.id === id);

/** Throws on an unknown id: ids come from our own data, not from players. */
export const getCourse = (id: string): Course => {
  const course = findCourse(id);
  if (!course) throw new Error(`Unknown course "${id}"`);
  return course;
};
