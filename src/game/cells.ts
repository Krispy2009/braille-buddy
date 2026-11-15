import { CellType, CLEAR_CELL, DOT_KEYS, DotKey, raisedDots } from "./braille";

/**
 * Helpers for signs written with more than one cell: a number with its
 * number sign, a two-cell punctuation mark, or a short word. Everything here
 * works for one cell too, so a caller never needs a special case.
 */

/** A cell from its raised dot numbers: [1, 4] raises dots 1 and 4. */
export const dotsToCell = (dots: readonly number[]): CellType =>
  Object.fromEntries(
    DOT_KEYS.map((dot, index) => [dot, dots.includes(index + 1)])
  ) as CellType;

export const sameCell = (a: CellType, b: CellType): boolean =>
  raisedDots(a).join() === raisedDots(b).join();

/** Same number of cells, and each cell has the same dots. */
export const sameCells = (
  a: readonly CellType[],
  b: readonly CellType[]
): boolean =>
  a.length === b.length && a.every((cell, index) => sameCell(cell, b[index]));

/** "no dots", "dot 1", "dots 1 and 4", "dots 1, 4 and 5". */
export const dotsInWords = (cell: CellType): string => {
  const dots = raisedDots(cell);
  if (dots.length === 0) return "no dots";
  if (dots.length === 1) return `dot ${dots[0]}`;
  return `dots ${dots.slice(0, -1).join(", ")} and ${dots[dots.length - 1]}`;
};

/**
 * One cell as `dotsInWords`; several as "dots 3, 4, 5 and 6, then dot 1".
 * Never ends on a single letter, so it can end a sentence.
 */
export const cellsInWords = (cells: readonly CellType[]): string =>
  cells.length === 0 ? "no cells" : cells.map(dotsInWords).join(", then ");

/** "Cell 2 of 3", counted from 1, for a label or an announcement. */
export const cellLabel = (index: number, count: number): string =>
  `Cell ${index + 1} of ${count}`;

/**
 * What the player has entered so far for a sign of one or more cells, and
 * which cell they are on. Every function returns a new value, so it suits
 * React state: `setEntry((entry) => toggleEntryDot(entry, "dot1"))`.
 */
export type CellEntry = {
  readonly cells: readonly CellType[];
  /** The cell being written, from 0. */
  readonly current: number;
};

/** Empty cells to fill, starting on the first. At least one cell. */
export const startEntry = (count: number): CellEntry => ({
  cells: Array.from({ length: Math.max(1, count) }, () => CLEAR_CELL),
  current: 0,
});

export const currentCell = (entry: CellEntry): CellType =>
  entry.cells[entry.current];

const replaceCurrent = (entry: CellEntry, cell: CellType): CellEntry => ({
  ...entry,
  cells: entry.cells.map((old, index) => (index === entry.current ? cell : old)),
});

/** Replaces the current cell, as a chord typed in one go does. */
export const setCurrentCell = (entry: CellEntry, cell: CellType): CellEntry =>
  replaceCurrent(entry, cell);

export const toggleEntryDot = (entry: CellEntry, dot: DotKey): CellEntry => {
  const cell = currentCell(entry);
  return replaceCurrent(entry, { ...cell, [dot]: !cell[dot] });
};

/** Lowers every dot of the current cell; the other cells stay. */
export const clearCurrentCell = (entry: CellEntry): CellEntry =>
  replaceCurrent(entry, CLEAR_CELL);

/** Moves to a cell, kept within the entry. */
export const moveToCell = (entry: CellEntry, index: number): CellEntry => ({
  ...entry,
  current: Math.min(Math.max(index, 0), entry.cells.length - 1),
});

export const nextCell = (entry: CellEntry): CellEntry =>
  moveToCell(entry, entry.current + 1);

export const previousCell = (entry: CellEntry): CellEntry =>
  moveToCell(entry, entry.current - 1);

export const isLastCell = (entry: CellEntry): boolean =>
  entry.current === entry.cells.length - 1;

/** The first cell with no dots raised, or -1 when every cell has some. */
export const firstEmptyCell = (entry: CellEntry): number =>
  entry.cells.findIndex((cell) => raisedDots(cell).length === 0);

/** "Cell 1 of 2" for the cell being written. */
export const entryLabel = (entry: CellEntry): string =>
  cellLabel(entry.current, entry.cells.length);
