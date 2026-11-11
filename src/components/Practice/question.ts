import {
  cellForLetter,
  CellType,
  CLEAR_CELL,
  itemId,
  ItemId,
  Language,
  LANGUAGE_LABELS,
  parseItemId,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
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

export const answerCell = (item: ItemId): CellType => {
  const { letter, language } = parseItemId(item);
  return cellForLetter(letter, language) ?? CLEAR_CELL;
};

const sameCell = (a: CellType, b: CellType): boolean =>
  raisedDots(a).join() === raisedDots(b).join();

export const isRightCell = (item: ItemId, cell: CellType): boolean =>
  sameCell(answerCell(item), cell);

/** "no dots", "dot 1", "dots 1 and 4", "dots 1, 4 and 5". */
export const dotsInWords = (cell: CellType): string => {
  const dots = raisedDots(cell);
  if (dots.length === 0) return "no dots";
  if (dots.length === 1) return `dot ${dots[0]}`;
  return `dots ${dots.slice(0, -1).join(", ")} and ${dots[dots.length - 1]}`;
};

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Every sentence ends on a word or a number, never a single letter: screen
// readers read "d." as an abbreviation and run on into the next sentence.
const rule = (item: ItemId): string => {
  const { letter, language } = parseItemId(item);
  const cell = answerCell(item);
  const verb = raisedDots(cell).length === 1 ? "makes" : "make";
  return `${capitalize(dotsInWords(cell))} ${verb} ${spokenLetter(
    letter,
    language
  )} in ${LANGUAGE_LABELS[language]}.`;
};

export type Answer =
  | { kind: "dots"; correct: boolean; cell: CellType }
  | { kind: "letter"; correct: boolean; choice: string };

const mistakeText = (item: ItemId, answer: Answer): string => {
  if (answer.kind === "dots") {
    return `You raised ${dotsInWords(answer.cell)}.`;
  }
  const { language } = parseItemId(item);
  const chosen = cellForLetter(answer.choice, language) ?? CLEAR_CELL;
  return `You chose ${spokenLetter(answer.choice, language)}, which is ${dotsInWords(
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
    return `You have finished ${lesson.title}, the last lesson in the ${course.name} course. Congratulations, you have learnt every letter it teaches.`;
  }
  if (next) {
    return `You have finished the lesson ${lesson.title}, and ${next.title} is now open.`;
  }
  return `You have finished the lesson ${lesson.title}, well done.`;
};
