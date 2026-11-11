import { COURSES, findCourse } from "../courses";

export type CellType = {
  dot1: boolean;
  dot2: boolean;
  dot3: boolean;
  dot4: boolean;
  dot5: boolean;
  dot6: boolean;
};

export type DotKey = keyof CellType;

/** A course id, such as "english". See src/courses. */
export type Language = string;

/** Identifies one thing to learn, e.g. "english:a" or "greek:ει". */
export type ItemId = `${Language}:${string}`;

export const LANGUAGES: Language[] = COURSES.map((course) => course.id);

export const LANGUAGE_LABELS: Record<Language, string> = Object.fromEntries(
  COURSES.map((course) => [course.id, course.name])
);

/** BCP 47 tags, for the `lang` attribute on letters. */
export const LANGUAGE_TAGS: Record<Language, string> = Object.fromEntries(
  COURSES.map((course) => [course.id, course.lang])
);

export const DOT_KEYS: readonly DotKey[] = [
  "dot1",
  "dot2",
  "dot3",
  "dot4",
  "dot5",
  "dot6",
];

export const CLEAR_CELL: CellType = {
  dot1: false,
  dot2: false,
  dot3: false,
  dot4: false,
  dot5: false,
  dot6: false,
};

/** A cell as six characters, dot 1 first: dots 1 and 2 raised is "110000". */
export const cellToBitmap = (cell: CellType): string =>
  DOT_KEYS.map((dot) => (cell[dot] ? "1" : "0")).join("");

export const bitmapToCell = (bitmap: string): CellType =>
  Object.fromEntries(
    DOT_KEYS.map((dot, index) => [dot, bitmap[index] === "1"])
  ) as CellType;

/** The raised dot numbers of a cell, in order: [1, 4, 5]. */
export const raisedDots = (cell: CellType): number[] =>
  DOT_KEYS.filter((dot) => cell[dot]).map((dot) => Number(dot.slice(3)));

const letters = (language: Language) => findCourse(language)?.letters ?? [];

const sameDots = (dots: number[], cell: CellType): boolean =>
  dots.join() === raisedDots(cell).join();

export const letterForCell = (
  cell: CellType,
  language: Language
): string | undefined =>
  letters(language).find((entry) => sameDots(entry.dots, cell))?.letter;

/** Every letter (or letter pair) a language teaches, in teaching order. */
export const lettersIn = (language: Language): string[] =>
  letters(language).map((entry) => entry.letter);

export const cellForLetter = (
  letter: string,
  language: Language
): CellType | undefined => {
  const entry = letters(language).find((item) => item.letter === letter);
  return entry
    ? (Object.fromEntries(
        DOT_KEYS.map((dot, index) => [dot, entry.dots.includes(index + 1)])
      ) as CellType)
    : undefined;
};

export const itemId = (language: Language, letter: string): ItemId =>
  `${language}:${letter}`;

export const parseItemId = (
  id: ItemId
): { language: Language; letter: string } => {
  const separator = id.indexOf(":");
  return {
    language: id.slice(0, separator) as Language,
    letter: id.slice(separator + 1),
  };
};

// Screen readers without a Greek voice spell Greek characters as symbols
// ("greek letter epsilon") and drop the rest of a letter pair, so courses can
// give a spoken name: ει is read as "epsilon iota".
/** How a letter should be announced by a screen reader. */
export const spokenLetter = (letter: string, language: Language): string =>
  letters(language).find((entry) => entry.letter === letter)?.spoken ?? letter;
