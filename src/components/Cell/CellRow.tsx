import type { CSSProperties } from "react";
import type { CellType } from "../../game/braille";
import { cellLabel, dotsInWords } from "../../game/cells";
import { Cell } from "./Cell";
import type { CellProps } from "./Cell";
import "./Cell.css";

type CellRowProps = {
  /** The cells in reading order: a number sign then a digit, or a word. */
  cells: readonly CellType[];
  size?: "medium" | "small";
  /**
   * The cell being written. With `onSelect`, each cell becomes a button that
   * moves there, named "Cell 1 of 2, dots 3, 4, 5 and 6".
   */
  current?: number;
  onSelect?: (index: number) => void;
  /** Name of the group of cell buttons. Only used with `onSelect`. */
  label?: string;
  /** Read-only rows only: dots to mark in each cell, see `Cell`. */
  marks?: readonly CellProps["marks"][];
};

/**
 * A row of braille cells, read left to right. Read-only by default, and then
 * hidden from screen readers like `Cell`: say the cells in words next to it
 * (`cellsInWords`). One read-only cell renders exactly as a plain `Cell`.
 */
export const CellRow = ({
  cells,
  size = "small",
  current,
  onSelect,
  label = "Cells",
  marks,
}: CellRowProps) => {
  const className = `cell-row ${size}`;
  const style = { "--cells": cells.length } as CSSProperties;
  if (!onSelect) {
    if (cells.length === 1) {
      return <Cell positions={cells[0]} size={size} marks={marks?.[0]} />;
    }
    return (
      <div className={className} style={style} aria-hidden="true">
        {cells.map((cell, index) => (
          <Cell key={index} positions={cell} size={size} marks={marks?.[index]} />
        ))}
      </div>
    );
  }
  return (
    <div className={className} style={style} role="group" aria-label={label}>
      {cells.map((cell, index) => (
        <button
          key={index}
          type="button"
          className="cell-row-button"
          aria-current={index === current ? "true" : undefined}
          aria-label={`${cellLabel(index, cells.length)}, ${dotsInWords(cell)}`}
          onClick={() => onSelect(index)}
        >
          <Cell positions={cell} size={size} />
        </button>
      ))}
    </div>
  );
};
