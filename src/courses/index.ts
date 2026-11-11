/**
 * A course is one language's braille alphabet plus the order it is taught in.
 * Adding a language means adding a JSON file to this folder: nothing else in
 * the code needs to change. `courses.test.ts` checks every file's shape.
 */
export type CourseLetter = {
  /** A letter, or a letter pair written with one cell such as "ου". */
  letter: string;
  /** Raised dots, 1 to 6, in ascending order. */
  dots: number[];
  /**
   * How a screen reader should say the letter, when the letter itself isn't
   * read well without that language's voice installed ("alpha").
   */
  spoken?: string;
};

export type Lesson = {
  id: string;
  title: string;
  /** The letters this lesson introduces. Each letter belongs to one lesson. */
  letters: string[];
};

export type Course = {
  /** Stable id, used in saved progress. Never rename it. */
  id: string;
  /** Shown to the player, in the interface language. */
  name: string;
  /** BCP 47 tag for the `lang` attribute on this course's letters. */
  lang: string;
  letters: CourseLetter[];
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
