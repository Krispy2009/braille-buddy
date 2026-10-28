import React from "react";
import { Cell } from "../Cell/Cell";
import { CellType } from "../Dot/Dot";
import mappings from "./mappings.json";

const CLEAR_CELL: CellType = {
  dot1: false,
  dot2: false,
  dot3: false,
  dot4: false,
  dot5: false,
  dot6: false,
};

type Language = keyof typeof mappings;

const translateCellToBitmap = (cells: CellType): string =>
  (Object.keys(CLEAR_CELL) as (keyof CellType)[])
    .map((dot) => (cells[dot] ? "1" : "0"))
    .join("");

const translateCellToLetter = (
  cells: CellType,
  language: Language
): string | undefined =>
  (mappings[language] as Record<string, string>)[translateCellToBitmap(cells)];

export const Board = () => {
  const [positions, setPositions] = React.useState<CellType>(CLEAR_CELL);

  const letterEN = translateCellToLetter(positions, "english");
  const letterGR = translateCellToLetter(positions, "greek");

  const toggleDot = React.useCallback((dot: keyof CellType) => {
    setPositions((current) => ({ ...current, [dot]: !current[dot] }));
  }, []);

  const clearCell = React.useCallback(() => setPositions(CLEAR_CELL), []);

  React.useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (/^[1-6]$/.test(event.key)) {
        toggleDot(`dot${event.key}` as keyof CellType);
      }
      if (event.key === "Escape" || event.key === "Backspace") {
        clearCell();
      }
    };
    document.body.addEventListener("keyup", onKeyUp);

    return () => {
      document.body.removeEventListener("keyup", onKeyUp);
    };
  }, [toggleDot, clearCell]);

  return (
    <div>
      <h2> braille cell</h2>
      <Cell positions={positions} onClick={toggleDot} />
      <button
        type="button"
        className="clear-button"
        onClick={clearCell}
        aria-label="Clear"
        title="Clear (Backspace)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
      <div className={"results"}>
        <div className={"result"}>
          <span className={"TranslatedLetter"}>{letterEN}</span> English
        </div>
        <div className={"result"}>
          <span className={"TranslatedLetter"}>{letterGR} </span> Greek
        </div>
      </div>
    </div>
  );
};
