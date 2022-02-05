import React from "react";
import { Cell } from "../Cell/Cell";
import { CellType } from "../Dot/Dot";
import mappings from "./mappings.json";

const CLEAR_CELL = {
  dot1: false,
  dot2: false,
  dot3: false,
  dot4: false,
  dot5: false,
  dot6: false,
};

export const Board = () => {
  const [positions, setPositions] = React.useState(CLEAR_CELL);

  const [letterEN, setLetterEN] = React.useState("");
  const [letterGR, setLetterGR] = React.useState("");

  const updatePositions = (dot: keyof CellType) => {
    const newCells: CellType = { ...positions };
    newCells[dot] = !positions[dot];
    setPositions(newCells);
    return newCells;
  };

  const translate = (newCells: CellType) => {
    const translatedLetterEN: string = translateCellToLetter(newCells);
    setLetterEN(translatedLetterEN);

    const translatedLetterGR: string = translateCellToLetter(newCells, "gr");
    setLetterGR(translatedLetterGR);
  };

  React.useEffect(() => {
    let keyPressedDot: keyof CellType;
    const onKeyUp = (event: any) => {
      if ([1, 2, 3, 4, 5, 6].includes(parseInt(event.key))) {
        keyPressedDot = `dot${event.key}` as keyof CellType;
        const newCells = updatePositions(keyPressedDot);
        translate(newCells);
      }
      if (event.key === "Escape") {
        setPositions(CLEAR_CELL);
        translate(CLEAR_CELL);
      }
    };
    document.body.addEventListener("keyup", onKeyUp);

    return () => {
      document.body.removeEventListener("keyup", onKeyUp);
    };
  }, [positions]);

  const onClick = (dot: keyof CellType) => {
    const newCells = updatePositions(dot);
    translate(newCells);
  };

  const translateCellToBitmap = (cells: CellType): string => {
    let bitmap: string = "";
    for (const dot in positions) {
      const dot2: keyof CellType = dot as keyof CellType;
      bitmap += cells[dot2] ? "1" : "0";
    }
    return bitmap;
  };

  const translateCellToLetter = (
    cells: CellType,
    language: string = "en"
  ): string => {
    const bitmap: string = translateCellToBitmap(cells);
    if (language === "en") {
      return (mappings.english as any)[bitmap];
    } else {
      return (mappings.greek as any)[bitmap];
    }
  };

  return (
    <div>
      <h2> braille cell</h2>
      <Cell positions={positions} onClick={onClick} />
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
