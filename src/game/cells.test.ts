import { getCourse } from "../courses";
import {
  cellForLetter,
  cellsForLetter,
  CLEAR_CELL,
  kindOfLetter,
  letterForCell,
  raisedDots,
} from "./braille";
import {
  cellLabel,
  cellsInWords,
  clearCurrentCell,
  currentCell,
  dotsInWords,
  dotsToCell,
  entryLabel,
  firstEmptyCell,
  isLastCell,
  moveToCell,
  nextCell,
  previousCell,
  sameCells,
  setCurrentCell,
  startEntry,
  toggleEntryDot,
} from "./cells";
import { entriesNoun } from "./lessons";

const dots = (cells: readonly { dot1: boolean }[]) =>
  cells.map((cell) => raisedDots(cell as typeof CLEAR_CELL));

describe("cells in words", () => {
  test("one cell reads as before", () => {
    expect(dotsInWords(CLEAR_CELL)).toBe("no dots");
    expect(cellsInWords([dotsToCell([1])])).toBe("dot 1");
    expect(cellsInWords([dotsToCell([1, 4, 5])])).toBe("dots 1, 4 and 5");
  });

  test("several cells are joined with then", () => {
    expect(cellsInWords([dotsToCell([3, 4, 5, 6]), dotsToCell([1])])).toBe(
      "dots 3, 4, 5 and 6, then dot 1"
    );
    expect(cellLabel(0, 2)).toBe("Cell 1 of 2");
  });

  test("sameCells needs the same count and the same dots in order", () => {
    const a = dotsToCell([1]);
    const b = dotsToCell([1, 2]);
    expect(sameCells([a, b], [a, b])).toBe(true);
    expect(sameCells([a, b], [b, a])).toBe(false);
    expect(sameCells([a], [a, b])).toBe(false);
  });
});

describe("entering several cells", () => {
  test("starts on the first of the empty cells", () => {
    const entry = startEntry(2);
    expect(entry.cells).toHaveLength(2);
    expect(entry.current).toBe(0);
    expect(entryLabel(entry)).toBe("Cell 1 of 2");
    expect(firstEmptyCell(entry)).toBe(0);
    expect(startEntry(0).cells).toHaveLength(1);
  });

  test("dots go to the current cell, and moving keeps the others", () => {
    let entry = startEntry(2);
    entry = toggleEntryDot(entry, "dot3");
    entry = toggleEntryDot(entry, "dot4");
    expect(isLastCell(entry)).toBe(false);
    entry = nextCell(entry);
    expect(entryLabel(entry)).toBe("Cell 2 of 2");
    expect(isLastCell(entry)).toBe(true);
    expect(firstEmptyCell(entry)).toBe(1);
    entry = setCurrentCell(entry, dotsToCell([1, 2]));
    expect(dots(entry.cells)).toEqual([[3, 4], [1, 2]]);
    expect(firstEmptyCell(entry)).toBe(-1);

    entry = previousCell(entry);
    expect(raisedDots(currentCell(entry))).toEqual([3, 4]);
    entry = clearCurrentCell(entry);
    expect(dots(entry.cells)).toEqual([[], [1, 2]]);
  });

  test("moves stay within the entry and never change the old value", () => {
    const entry = startEntry(3);
    expect(moveToCell(entry, 7).current).toBe(2);
    expect(moveToCell(entry, -1).current).toBe(0);
    expect(previousCell(entry).current).toBe(0);
    toggleEntryDot(entry, "dot1");
    expect(firstEmptyCell(entry)).toBe(0);
  });
});

describe("courses with signs of several cells", () => {
  test("a number is the number sign then a to j", () => {
    expect(dots(cellsForLetter("7", "english")!)).toEqual([[3, 4, 5, 6], [1, 2, 4, 5]]);
    expect(dots(cellsForLetter("0", "greek")!)).toEqual([[3, 4, 5, 6], [2, 4, 5]]);
    expect(kindOfLetter("7", "english")).toBe("number");
    expect(kindOfLetter("?", "english")).toBe("punctuation");
    expect(kindOfLetter("a", "english")).toBe("letter");
  });

  test("letters keep their one cell, and only one-cell signs match a cell", () => {
    expect(dots(cellsForLetter("a", "english")!)).toEqual([[1]]);
    expect(raisedDots(cellForLetter("ου", "greek")!)).toEqual([1, 3, 6]);
    // A number has no single cell of its own.
    expect(cellForLetter("7", "english")).toBeUndefined();
    // g stays g, though it is also the last cell of 7.
    expect(letterForCell(dotsToCell([1, 2, 4, 5]), "english")).toBe("g");
    expect(letterForCell(dotsToCell([2, 3, 6]), "english")).toBe("?");
    expect(letterForCell(dotsToCell([3, 4, 5, 6]), "english")).toBeUndefined();
  });

  test("a lesson is named by what it teaches", () => {
    const english = getCourse("english");
    const [letters, , , , , numbers, , punctuation] = english.lessons;
    expect(entriesNoun(english, letters.letters)).toBe("letters");
    expect(entriesNoun(english, numbers.letters)).toBe("numbers");
    expect(entriesNoun(english, punctuation.letters)).toBe("signs");
    expect(entriesNoun(english, [...letters.letters, ...numbers.letters])).toBe("signs");
  });
});
