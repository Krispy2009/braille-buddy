import { Dot, CellType } from "../Dot/Dot";

type CellProps = {
  positions: CellType;
  onClick: (dot: keyof CellType) => void;
};

const DOTS = ["dot1", "dot2", "dot3", "dot4", "dot5", "dot6"] as const;

export const Cell = ({ positions, onClick }: CellProps) => {
  return (
    <div
      className="cell"
      role="group"
      aria-label="Braille cell, six dots"
      aria-describedby="cell-help"
    >
      {DOTS.map((dot) => (
        <Dot key={dot} cellId={dot} isOn={positions[dot]} onClick={onClick} />
      ))}
    </div>
  );
};
