import React from "react";
import { Cell } from "../Cell/Cell";
import { ChordPad } from "../ChordPad/ChordPad";
import { ClearButton } from "../ClearButton/ClearButton";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import {
  CellType,
  CLEAR_CELL,
  letterForCell,
  raisedDots,
  spokenLetter,
} from "../../game/braille";

const describeCell = (
  cells: CellType,
  english?: string,
  greek?: string
): string => {
  const raised = raisedDots(cells);
  if (raised.length === 0) {
    return "Cell is empty.";
  }
  // Never end a sentence on a single letter: screen readers read "w." as an
  // abbreviation and run straight into the next sentence without a pause.
  const englishPart = english ? `${english} in English.` : "No English letter.";
  const greekPart = greek
    ? `${spokenLetter(greek, "greek")} in Greek.`
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

  const letterEN = letterForCell(positions, "english");
  const letterGR = letterForCell(positions, "greek");

  const toggleDot = React.useCallback((dot: keyof CellType) => {
    setPositions((current) => ({ ...current, [dot]: !current[dot] }));
  }, []);

  const clearCell = React.useCallback(() => setPositions(CLEAR_CELL), []);

  const padRef = React.useRef<HTMLDivElement>(null);
  useBrailleKeys({
    onToggleDot: toggleDot,
    onChord: setPositions,
    onClear: clearCell,
    chordArea: padRef,
  });

  const helpId = React.useId();

  return (
    <div className="board">
      <div className="plate">
        <Cell
          positions={positions}
          onClick={toggleDot}
          describedBy={helpId}
        />
      </div>

      <dl className="results" aria-label="Translation">
        <Result label="English" lang="en" letter={letterEN} />
        <Result
          label="Greek"
          lang="el"
          letter={letterGR}
          spoken={letterGR && spokenLetter(letterGR, "greek")}
        />
      </dl>

      <ClearButton onClick={clearCell} />

      <p id={helpId} className="help">
        Select a dot to raise or lower it. On a keyboard, press <kbd>1</kbd>{" "}
        to <kbd>6</kbd>, or type a whole letter as a chord in the braille
        keyboard below.
      </p>

      <ChordPad ref={padRef} />

      <p className="sr-only" role="status">
        {describeCell(positions, letterEN, letterGR)}
      </p>
    </div>
  );
};
