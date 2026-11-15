import {
  cellsForLetter,
  CellType,
  CLEAR_CELL,
  itemId,
  ItemId,
  kindOfLetter,
  Language,
  LANGUAGE_LABELS,
  parseItemId,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import { cellsInWords, dotsInWords, sameCells } from "../../game/cells";
import type { Course, Lesson } from "../../courses";
import { POINTS_PER_CORRECT, Progress } from "../../game/progress";
import { pickDistractors, pickNextItem } from "../../game/review";

export type Question =
  /** Letter to dots: the player raises the dots for a named letter. */
  | { kind: "dots"; item: ItemId }
  /** Dots to letter: the player picks the letter for a cell. */
  | { kind: "letter"; item: ItemId; choices: string[] };

const CHOICES = 4;

/** What a run of questions draws from: a lesson, or everything met so far. */
export type QuestionSource = {
  language: Language;
  /** The letters asked about. */
  letters: readonly string[];
  /** Other letters the player has already met, used as wrong choices too. */
  others: readonly string[];
};

// Mostly letters from the lesson itself, since telling its new letters apart
// is the point, plus one letter met earlier when there is one, so old letters
// stay in view. Short lessons borrow more from earlier ones.
const wrongChoices = (
  answer: string,
  { letters, others }: QuestionSource,
  random: () => number
): string[] => {
  const pool = others.filter((letter) => !letters.includes(letter));
  const earlier = pickDistractors(answer, pool, 1, random);
  const fromLesson = pickDistractors(
    answer,
    letters,
    CHOICES - 1 - earlier.length,
    random
  );
  const short = CHOICES - 1 - earlier.length - fromLesson.length;
  const more =
    short > 0
      ? pickDistractors(
          answer,
          pool.filter((letter) => !earlier.includes(letter)),
          short,
          random
        )
      : [];
  return [...fromLesson, ...earlier, ...more];
};

export const makeQuestion = (
  source: QuestionSource,
  progress: Progress,
  previous: ItemId | undefined,
  random: () => number
): Question => {
  const items = source.letters.map((letter) => itemId(source.language, letter));
  const item = pickNextItem(items, progress, { previous, random });
  if (random() < 0.5) {
    return { kind: "dots", item };
  }
  const { letter } = parseItemId(item);
  const choices = wrongChoices(letter, source, random);
  choices.splice(Math.floor(random() * (choices.length + 1)), 0, letter);
  return { kind: "letter", item, choices };
};

export { dotsInWords };

/** Every cell of the answer, in order: one for a letter, two for "7". */
export const answerCells = (item: ItemId): CellType[] => {
  const { letter, language } = parseItemId(item);
  return cellsForLetter(letter, language) ?? [CLEAR_CELL];
};

/** The answer's first cell: the whole answer for a one-cell letter. */
export const answerCell = (item: ItemId): CellType => answerCells(item)[0];

export const isRightCells = (
  item: ItemId,
  cells: readonly CellType[]
): boolean => sameCells(answerCells(item), cells);

export const isRightCell = (item: ItemId, cell: CellType): boolean =>
  isRightCells(item, [cell]);

const isLetter = (item: ItemId): boolean => {
  const { letter, language } = parseItemId(item);
  return kindOfLetter(letter, language) === "letter";
};

/**
 * The "dots to letter" question: "Which letter has dots 1 and 4?", or for
 * numbers and punctuation "Which sign has 2 cells, dots 3, 4, 5 and 6, then
 * dot 1?".
 */
export const choicePrompt = (item: ItemId): string => {
  const cells = answerCells(item);
  const noun = isLetter(item) ? "letter" : "sign";
  return cells.length === 1
    ? `Which ${noun} has ${dotsInWords(cells[0])}?`
    : `Which ${noun} has ${cells.length} cells, ${cellsInWords(cells)}?`;
};

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Every sentence ends on a word or a number, never a single letter: screen
// readers read "d." as an abbreviation and run on into the next sentence.
const rule = (item: ItemId): string => {
  const { letter, language } = parseItemId(item);
  const cells = answerCells(item);
  const name = spokenLetter(letter, language);
  if (!isLetter(item)) {
    return `${capitalize(name)} is written with ${cellsInWords(cells)}, in ${LANGUAGE_LABELS[language]}.`;
  }
  const verb = cells.length === 1 && raisedDots(cells[0]).length === 1 ? "makes" : "make";
  return `${capitalize(cellsInWords(cells))} ${verb} ${name} in ${LANGUAGE_LABELS[language]}.`;
};

export type Answer =
  /** What the player wrote, one entry per cell. */
  | { kind: "dots"; correct: boolean; cells: CellType[] }
  | { kind: "letter"; correct: boolean; choice: string };

const mistakeText = (item: ItemId, answer: Answer): string => {
  if (answer.kind === "dots") {
    return `You raised ${cellsInWords(answer.cells)}.`;
  }
  const { language } = parseItemId(item);
  const chosen = cellsForLetter(answer.choice, language) ?? [CLEAR_CELL];
  return `You chose ${spokenLetter(answer.choice, language)}, which is ${cellsInWords(
    chosen
  )}.`;
};

export const resultText = (item: ItemId, answer: Answer): string =>
  answer.correct
    ? `Correct, plus ${POINTS_PER_CORRECT} points. ${rule(item)}`
    : `Not quite. ${rule(item)} ${mistakeText(item, answer)}`;

export type Finished = {
  lesson: Lesson;
  /** The lesson it opened, if any. */
  next?: Lesson;
  /** Every lesson of the course is now done. */
  courseDone: boolean;
};

// Lesson titles never end a sentence either, since a title such as
// "Letters a to e" ends on a single letter.
export const finishedText = (
  course: Course,
  { lesson, next, courseDone }: Finished
): string => {
  if (courseDone) {
    return `You have finished ${lesson.title}, the last lesson in the ${course.name} course. Congratulations, you have learnt everything it teaches.`;
  }
  if (next) {
    return `You have finished the lesson ${lesson.title}, and ${next.title} is now open.`;
  }
  return `You have finished the lesson ${lesson.title}, well done.`;
};
