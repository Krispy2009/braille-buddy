import {
  cellForLetter,
  CellType,
  CLEAR_CELL,
  itemId,
  ItemId,
  Language,
  LANGUAGE_LABELS,
  lettersIn,
  parseItemId,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import { POINTS_PER_CORRECT, Progress } from "../../game/progress";
import { pickDistractors, pickNextItem } from "../../game/review";

export type Question =
  /** Letter to dots: the player raises the dots for a named letter. */
  | { kind: "dots"; item: ItemId }
  /** Dots to letter: the player picks the letter for a cell. */
  | { kind: "letter"; item: ItemId; choices: string[] };

const CHOICES = 4;

export const makeQuestion = (
  language: Language,
  progress: Progress,
  previous: ItemId | undefined,
  random: () => number
): Question => {
  const letters = lettersIn(language);
  const items = letters.map((letter) => itemId(language, letter));
  const item = pickNextItem(items, progress, { previous, random });
  if (random() < 0.5) {
    return { kind: "dots", item };
  }
  const { letter } = parseItemId(item);
  const choices = pickDistractors(letter, letters, CHOICES - 1, random);
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
