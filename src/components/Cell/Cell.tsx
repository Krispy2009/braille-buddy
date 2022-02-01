import React from "react";
import { Dot, CellType } from "../Dot/Dot";

export const Cell: React.FC = () => {
  const [cells, setCells] = React.useState({
    dot1: false,
    dot2: false,
    dot3: false,
    dot4: false,
    dot5: false,
    dot6: false,
  });

  const onClick = (dot: keyof CellType) => {
    const newCells: CellType = { ...cells };
    newCells[dot] = !cells[dot];
    setCells(newCells);
    console.log(newCells);
  };

  const translateCellToLetter = () => {};

  return (
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
  );
};
