import type { CellType } from "../../game/braille";
import { cellLabel, dotsInWords } from "../../game/cells";
import { Cell } from "./Cell";
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
}: CellRowProps) => {
  if (!onSelect) {
    if (cells.length === 1) return <Cell positions={cells[0]} size={size} />;
    return (
      <div className="cell-row" aria-hidden="true">
        {cells.map((cell, index) => (
          <Cell key={index} positions={cell} size={size} />
        ))}
      </div>
    );
  }
  return (
    <div className="cell-row" role="group" aria-label={label}>
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
