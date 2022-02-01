import React from "react";
import { Dot, CellType } from "../Dot/Dot";

type CellProps = {
  positions: CellType;
  onClick: (dot: keyof CellType) => void;
};

export const Cell = ({ positions, onClick }: CellProps) => {
  return (
    <div className="cell">
      <Dot
        className={"dot1"}
        cellId={"dot1"}
        isOn={positions.dot1}
        onClick={onClick}
      />
      <Dot
        className={"dot2"}
        cellId={"dot2"}
        isOn={positions.dot2}
        onClick={onClick}
      />

      <Dot
        className={"dot3"}
        cellId={"dot3"}
        isOn={positions.dot3}
        onClick={onClick}
      />
      <Dot
        className={"dot4"}
        cellId={"dot4"}
        isOn={positions.dot4}
        onClick={onClick}
      />

      <Dot
        className={"dot5"}
        cellId={"dot5"}
        isOn={positions.dot5}
        onClick={onClick}
      />
      <Dot
        className={"dot6"}
        cellId={"dot6"}
        isOn={positions.dot6}
        onClick={onClick}
      />
    </div>
  );
};
