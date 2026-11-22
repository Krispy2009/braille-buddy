import { Dot, CellType } from "../Dot/Dot";
import "./Cell.css";

export type CellProps = {
  positions: CellType;
  /** Without it the cell is read-only and hidden from screen readers: show
      the dots in words next to it. */
  onClick?: (dot: keyof CellType) => void;
  /** Space separated ids of the help or question text for the dots. */
  describedBy?: string;
  /** Large by default: the hero of a screen. */
  size?: "medium" | "small";
  /**
   * Read-only cells only: dots to mark, as a wrong answer's compare does.
   * "extra" sets a cross on a dot that shouldn't be raised, "missed" rings
   * one that should have been. With it, each dot sits in a slot carrying
   * `data-dot` and `data-mark`.
   */
  marks?: Partial<Record<keyof CellType, "extra" | "missed">>;
};

/**
 * A mark drawn in ink on paper: a cross in a badge ("extra"), or a ring round
 * a small raised dot ("missed", as the key shows it; on a cell the ring is
 * drawn round the dot itself). Sized and coloured by CSS.
 */
export const MarkIcon = ({ mark }: { mark: "extra" | "missed" }) => (
  <svg className="mark-icon" data-mark={mark} viewBox="0 0 24 24" aria-hidden="true">
    {mark === "extra" ? (
      <>
        <circle className="mark-badge" cx="12" cy="12" r="10.5" />
        <path className="mark-cross" d="M8 8l8 8M16 8l-8 8" />
      </>
    ) : (
      <>
        <circle className="mark-ring" cx="12" cy="12" r="10.5" />
        <circle className="mark-dot" cx="12" cy="12" r="4.5" />
      </>
    )}
  </svg>
);

const DOTS = ["dot1", "dot2", "dot3", "dot4", "dot5", "dot6"] as const;

/** The braille cell: a raised plate with six dots, 1 to 3 down the left. */
export const Cell = ({ positions, onClick, describedBy, size, marks }: CellProps) => {
  const className = size ? `cell ${size}` : "cell";
  if (!onClick) {
    return (
      <div className={`${className} read-only`} aria-hidden="true">
        {DOTS.map((dot) =>
          marks ? (
            <span
              key={dot}
              className="dot-slot"
              data-dot={dot.slice(3)}
              data-mark={marks[dot]}
            >
              <Dot cellId={dot} isOn={positions[dot]} />
              {marks[dot] === "extra" && <MarkIcon mark="extra" />}
            </span>
          ) : (
            <Dot key={dot} cellId={dot} isOn={positions[dot]} />
          )
        )}
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
