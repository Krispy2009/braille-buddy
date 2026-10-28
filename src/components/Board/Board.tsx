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

  React.useEffect(() => {
    const onKeyUp = (event: KeyboardEvent) => {
      if (/^[1-6]$/.test(event.key)) {
        toggleDot(`dot${event.key}` as keyof CellType);
      }
      if (event.key === "Escape") {
        setPositions(CLEAR_CELL);
      }
    };
    document.body.addEventListener("keyup", onKeyUp);

    return () => {
      document.body.removeEventListener("keyup", onKeyUp);
    };
  }, [toggleDot]);

  return (
    <div>
      <h2> braille cell</h2>
      <Cell positions={positions} onClick={toggleDot} />
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
