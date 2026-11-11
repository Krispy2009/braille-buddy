import { Dot, CellType } from "../Dot/Dot";

type CellProps = {
  positions: CellType;
  /** Without it the cell is read-only and hidden from screen readers: show
      the dots in words next to it. */
  onClick?: (dot: keyof CellType) => void;
  /** Space separated ids of the help or question text for the dots. */
  describedBy?: string;
  size?: "small";
};

const DOTS = ["dot1", "dot2", "dot3", "dot4", "dot5", "dot6"] as const;

export const Cell = ({ positions, onClick, describedBy, size }: CellProps) => {
  const className = size ? `cell ${size}` : "cell";
  if (!onClick) {
    return (
      <div className={className} aria-hidden="true">
        {DOTS.map((dot) => (
          <Dot key={dot} cellId={dot} isOn={positions[dot]} />
        ))}
      </div>
    );
  }
  return (
    <div
      className={className}
      role="group"
      aria-label="Braille cell, six dots"
      aria-describedby={describedBy}
    >
      {DOTS.map((dot) => (
        <Dot key={dot} cellId={dot} isOn={positions[dot]} onClick={onClick} />
      ))}
    </div>
  );
};
