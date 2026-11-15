import { cellsForLetter, cellToBitmap, CellType, Language, spokenLetter } from "../game/braille";
import { dayKey, dayNumber } from "../game/progress";
import { decodeWords } from "./wordCodec";
import englishEncoded from "./words.en.dat?raw";
import greekEncoded from "./words.el.dat?raw";

/**
 * The daily puzzle (issue #51): the same two words for everyone on a given
 * local day, picked from a curated list for the course, so it works offline.
 *
 * The word lists are short, common, family-friendly words of 3 to 5 letters,
 * spelled letter by letter, one cell per letter (uncontracted braille), using
 * only the course's letters. `daily.test.ts` checks this for every word.
 *
 * The lists are stored obfuscated (words.*.dat, see wordCodec.ts) so they are
 * not spoiled in the repo or the bundle; edit them with `npm run words:show`
 * and `npm run words:encode`. The order is part of the data: it decides which
 * word each day gets.
 *
 * Greek words are lowercase and unaccented, as the course's letters are.
 * Greek braille writes the pairs αι, ει, οι, υι, αυ, ευ, ηυ and ου with one
 * cell each, so spelling those letter by letter would be wrong braille: the
 * Greek list leaves out every word containing one of them, which keeps "one
 * letter, one cell" true for both courses. It also leaves out words ending in
 * sigma, whose print form would be the final ς the course doesn't teach.
 */
export const WORD_LISTS: Readonly<Record<Language, readonly string[]>> = {
  english: decodeWords(englishEncoded),
  greek: decodeWords(greekEncoded),
};

/** Greek braille's one-cell letter pairs, which the Greek list never contains. */
export const ONE_CELL_PAIRS = ["αι", "ει", "οι", "υι", "αυ", "ευ", "ηυ", "ου"];

export const MAX_TRIES = 3;

/** The link shared with a result: the live site, as given in the README. */
export const SITE_URL = "https://braille-buddy.krispytech.workers.dev/";

export type DailyPuzzle = {
  /** Local calendar day, "YYYY-MM-DD". */
  day: string;
  course: Language;
  /** Shown in braille; the player types it in print. */
  read: string;
  /** Shown in print; the player writes it in braille. */
  write: string;
};

// FNV-1a, then a final mix so nearby seeds give unrelated shuffles.
const hash = (text: string): number => {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  return value >>> 0;
};

// mulberry32: a tiny seeded generator, the same in every browser.
const seededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const shuffles = new Map<string, readonly string[]>();

const shuffled = (words: readonly string[], seed: string): readonly string[] => {
  const cached = shuffles.get(seed);
  if (cached) return cached;
  const random = seededRandom(hash(seed));
  const copy = [...words];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  shuffles.set(seed, copy);
  return copy;
};

// Words move only within their block of ten from one pass to the next.
const BLOCK = 10;

const passOrders = new Map<string, readonly string[]>();

const passOrder = (course: Language, words: readonly string[], pass: number) => {
  const key = `${course}:${pass}`;
  const cached = passOrders.get(key);
  if (cached) return cached;
  const base = shuffled(words, course);
  const order: string[] = [];
  for (let start = 0; start < base.length; start += BLOCK) {
    order.push(...shuffled(base.slice(start, start + BLOCK), `${key}:${start}`));
  }
  passOrders.set(key, order);
  return order;
};

/**
 * The puzzle for a course on a day, or undefined for a course with no word
 * list. Each day takes the next two words of a seeded shuffle of the list.
 * Every pass through the list reshuffles each block of ten words, so the
 * pairs change, while a word stays near its place: it never comes back
 * sooner than about a whole pass later (over 3 months for English, 2 for
 * Greek).
 */
export const puzzleForDay = (course: Language, day: string): DailyPuzzle | undefined => {
  const words = WORD_LISTS[course];
  if (!words || words.length < 3) return undefined;
  const count = words.length;
  const wordAt = (position: number) => {
    const pass = Math.floor(position / count);
    return passOrder(course, words, pass)[position - pass * count];
  };
  const position = 2 * dayNumber(day);
  const read = wordAt(position);
  let write = wordAt(position + 1);
  // Only possible where one pass ends and the next begins.
  if (write === read) write = wordAt(position + 2);
  return { day, course, read, write };
};

/** Today's puzzle by the player's own clock: a new one at local midnight. */
export const dailyPuzzle = (course: Language, now: Date): DailyPuzzle | undefined =>
  puzzleForDay(course, dayKey(now));

/** The letters of a word, one per cell. */
export const wordLetters = (word: string): string[] => Array.from(word);

/** The cells of a word, one per letter. */
export const wordCells = (word: string, language: Language): CellType[] =>
  wordLetters(word).flatMap((letter) => cellsForLetter(letter, language) ?? []);

/** "c, a, t" or "gamma, alpha, tau, alpha": a word spelled for a screen reader. */
export const spellWord = (word: string, language: Language): string =>
  wordLetters(word)
    .map((letter) => spokenLetter(letter, language))
    .join(", ");

/**
 * What the player typed, made comparable with a word from the list: no
 * spaces, lowercase, accents dropped (γάτα is γατα), final ς as σ.
 */
export const normaliseGuess = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/ς/g, "σ")
    .replace(/\s+/g, "");

/** For each letter of the answer, whether the guess has it in that place. */
export const letterMarks = (guess: string, answer: string): boolean[] => {
  const guessed = wordLetters(guess);
  return wordLetters(answer).map((letter, index) => guessed[index] === letter);
};

/** A written answer as text, for saving: "100100 100000 011110". */
export const cellsToGuess = (cells: readonly CellType[]): string =>
  cells.map(cellToBitmap).join(" ");

/** For each cell of the answer, whether the guess has the same dots there. */
export const cellMarks = (guess: string, answer: string, language: Language): boolean[] => {
  const guessed = guess.split(" ");
  return wordCells(answer, language).map(
    (cell, index) => guessed[index] === cellToBitmap(cell)
  );
};

const listInWords = (items: readonly (string | number)[]): string =>
  items.length === 1
    ? String(items[0])
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * A gentle hint after a wrong try: which letters are already right, by
 * place. "Letters 1 and 3 are right." Says the length when it differs.
 */
export const hintText = (marks: readonly boolean[], guessLength?: number): string => {
  const right = marks.flatMap((mark, index) => (mark ? [index + 1] : []));
  const parts = [
    right.length === 0
      ? "No letters are in the right place yet."
      : right.length === 1
        ? `Letter ${right[0]} is right.`
        : `Letters ${listInWords(right)} are right.`,
  ];
  if (guessLength !== undefined && guessLength !== marks.length) {
    parts.push(`The word has ${marks.length} letters.`);
  }
  return parts.join(" ");
};

/** "Two more tries." after the first miss, "One more try." after the second. */
export const triesLeftText = (used: number): string => {
  const left = MAX_TRIES - used;
  return left === 1 ? "One more try." : `${left === 2 ? "Two" : left} more tries.`;
};

/** One half's outcome, from whether each try was right. */
export type HalfResult = {
  tries: number;
  solved: boolean;
  /** Solved, or every try used. */
  finished: boolean;
};

export const halfResult = (attempts: readonly boolean[]): HalfResult => {
  const solved = attempts.includes(true);
  return {
    tries: solved ? attempts.indexOf(true) + 1 : attempts.length,
    solved,
    finished: solved || attempts.length >= MAX_TRIES,
  };
};

/** Points for finishing: some for playing, more for each word got. */
export const DAILY_POINTS_FOR_FINISHING = 10;
export const DAILY_POINTS_PER_WORD = 20;

export const dailyPoints = (read: HalfResult, write: HalfResult): number =>
  DAILY_POINTS_FOR_FINISHING +
  DAILY_POINTS_PER_WORD * [read, write].filter((half) => half.solved).length;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-15" as "15 Nov 2026", the same in every locale. */
export const formatDay = (day: string): string => {
  const [year, month, date] = day.split("-").map(Number);
  return `${date} ${MONTHS[month - 1]} ${year}`;
};

const halfText = (name: string, half: HalfResult): string =>
  half.solved
    ? `${name} in ${half.tries} ${half.tries === 1 ? "try" : "tries"}`
    : `${name}: answer shown after ${MAX_TRIES} tries`;

/** "Read it in 1 try, Write it in 2 tries" */
export const resultText = (read: HalfResult, write: HalfResult): string =>
  `${halfText("Read it", read)}, ${halfText("Write it", write)}`;

const RIGHT = "⠿";
const MISSED = "⠤";
const UNUSED = "⠀"; // U+2800, the blank braille cell

/** One row of the grid: a cell for each try, ⠿ right, ⠤ missed, ⠀ unused. */
export const gridRow = (attempts: readonly boolean[]): string =>
  Array.from({ length: MAX_TRIES }, (_, index) =>
    index >= attempts.length ? UNUSED : attempts[index] ? RIGHT : MISSED
  ).join("");

/** The shareable grid, one row per half. Nothing in it gives a word away. */
export const shareGrid = (read: readonly boolean[], write: readonly boolean[]): string =>
  `Read  ${gridRow(read)}\nWrite ${gridRow(write)}`;

/** The sentence a screen reader reads, and the first line of the share. */
export const shareSummary = (
  puzzle: DailyPuzzle,
  courseName: string,
  read: readonly boolean[],
  write: readonly boolean[]
): string =>
  `Braille Buddy daily, ${formatDay(puzzle.day)} (${courseName}): ${resultText(
    halfResult(read),
    halfResult(write)
  )}.`;

/** Everything shared: the sentence, the grid and the link. */
export const shareMessage = (
  puzzle: DailyPuzzle,
  courseName: string,
  read: readonly boolean[],
  write: readonly boolean[]
): string =>
  `${shareSummary(puzzle, courseName, read, write)}\n${shareGrid(read, write)}\n${SITE_URL}`;

/** Whether each saved try was right, for both halves. */
export const attemptsFor = (
  puzzle: DailyPuzzle,
  tries: { read: readonly string[]; write: readonly string[] }
): { read: boolean[]; write: boolean[] } => ({
  read: tries.read.map((guess) => guess === puzzle.read),
  write: tries.write.map(
    (guess) => guess === cellsToGuess(wordCells(puzzle.write, puzzle.course))
  ),
});
