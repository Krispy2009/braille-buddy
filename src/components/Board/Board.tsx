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

const DOT_KEYS = Object.keys(CLEAR_CELL) as (keyof CellType)[];

const translateCellToBitmap = (cells: CellType): string =>
  DOT_KEYS.map((dot) => (cells[dot] ? "1" : "0")).join("");

const translateCellToLetter = (
  cells: CellType,
  language: Language
): string | undefined =>
  (mappings[language] as Record<string, string>)[translateCellToBitmap(cells)];

// Screen readers without a Greek voice spell Greek characters as symbols
// ("greek letter epsilon") and drop the rest of a diphthong, so we announce
// the letter names instead: ει is read as "epsilon iota".
const GREEK_NAMES: Record<string, string> = {
  α: "alpha",
  β: "beta",
  γ: "gamma",
  δ: "delta",
  ε: "epsilon",
  ζ: "zeta",
  η: "eta",
  θ: "theta",
  ι: "iota",
  κ: "kappa",
  λ: "lambda",
  μ: "mu",
  ν: "nu",
  ξ: "xi",
  ο: "omicron",
  π: "pi",
  ρ: "rho",
  σ: "sigma",
  τ: "tau",
  υ: "upsilon",
  φ: "phi",
  χ: "chi",
  ψ: "psi",
  ω: "omega",
};

const speakGreek = (letters: string): string =>
  [...letters].map((letter) => GREEK_NAMES[letter] ?? letter).join(" ");

const describeCell = (
  cells: CellType,
  english?: string,
  greek?: string
): string => {
  const raised = DOT_KEYS.filter((dot) => cells[dot]).map((dot) =>
    dot.slice(3)
  );
  if (raised.length === 0) {
    return "Cell is empty.";
  }
  // Never end a sentence on a single letter: screen readers read "w." as an
  // abbreviation and run straight into the next sentence without a pause.
  const englishPart = english ? `${english} in English.` : "No English letter.";
  const greekPart = greek
    ? `${speakGreek(greek)} in Greek.`
    : "No Greek letter.";
  return `Dots ${raised.join(", ")} raised. ${englishPart} ${greekPart}`;
};

type ResultProps = {
  label: string;
  lang: string;
  letter?: string;
  spoken?: string;
};

const Result = ({ label, lang, letter, spoken }: ResultProps) => (
  <div className="result">
    <dt>{label}</dt>
    <dd>
      {letter && spoken ? (
        <>
          <span className="letter" lang={lang} aria-hidden="true">
            {letter}
          </span>
          <span className="sr-only">{spoken}</span>
        </>
      ) : letter ? (
        <span className="letter" lang={lang}>
          {letter}
        </span>
      ) : (
        <>
          <span className="letter empty" aria-hidden="true">
            –
          </span>
          <span className="sr-only">No letter</span>
        </>
      )}
    </dd>
  </div>
);

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
      // Leave browser and screen reader shortcuts (Ctrl+1, Alt+2...) alone.
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
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
    <div className="board">
      <div className="plate">
        <Cell positions={positions} onClick={toggleDot} />
      </div>

      <dl className="results" aria-label="Translation">
        <Result label="English" lang="en" letter={letterEN} />
        <Result
          label="Greek"
          lang="el"
          letter={letterGR}
          spoken={letterGR && speakGreek(letterGR)}
        />
      </dl>

      <button type="button" className="clear-button" onClick={clearCell}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        Clear
      </button>

      <p id="cell-help" className="help">
        Press <kbd>1</kbd> to <kbd>6</kbd> to raise or lower a dot, or select
        a dot. <kbd>Backspace</kbd> clears the cell.
      </p>

      <p className="sr-only" role="status">
        {describeCell(positions, letterEN, letterGR)}
      </p>
    </div>
  );
};
