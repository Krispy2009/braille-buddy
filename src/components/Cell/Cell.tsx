import React from "react";
import { Dot, CellType } from "../Dot/Dot";
import positions from "./positions.json";

export const Cell: React.FC = () => {
  const [cells, setCells] = React.useState({
    dot1: false,
    dot2: false,
    dot3: false,
    dot4: false,
    dot5: false,
    dot6: false,
  });
  const [letterEN, setLetterEN] = React.useState("");
  const [letterGR, setLetterGR] = React.useState("");

  const onClick = (dot: keyof CellType) => {
    const newCells: CellType = { ...cells };
    newCells[dot] = !cells[dot];
    setCells(newCells);
    const translatedLetterEN: string = translateCellToLetter(newCells);
    setLetterEN(translatedLetterEN);

    const translatedLetterGR: string = translateCellToLetter(newCells, "gr");
    setLetterGR(translatedLetterGR);
  };

  const translateCellToBitmap = (cells: CellType): string => {
    let bitmap: string = "";
    for (const dot in cells) {
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
      return (positions.english as any)[bitmap];
    } else {
      return (positions.greek as any)[bitmap];
    }
  };

  return (
    <div>
      <div className="cell">
        <Dot
          className={"dot1"}
          cellId={"dot1"}
          isOn={cells.dot1}
          onClick={onClick}
        />
        <Dot
          className={"dot2"}
          cellId={"dot2"}
          isOn={cells.dot2}
          onClick={onClick}
        />

        <Dot
          className={"dot3"}
          cellId={"dot3"}
          isOn={cells.dot3}
          onClick={onClick}
        />
        <Dot
          className={"dot4"}
          cellId={"dot4"}
          isOn={cells.dot4}
          onClick={onClick}
        />

        <Dot
          className={"dot5"}
          cellId={"dot5"}
          isOn={cells.dot5}
          onClick={onClick}
        />
        <Dot
          className={"dot6"}
          cellId={"dot6"}
          isOn={cells.dot6}
          onClick={onClick}
        />
      </div>
      <div>
        English: <span className={"TranslatedLetter"}>{letterEN}</span>
      </div>
      <div>
        Greek: <span className={"TranslatedLetter"}>{letterGR}</span>
      </div>
    </div>
  );
};
