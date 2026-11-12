import React from "react";
import { BraillerKeys, BraillerKeysHelp } from "../BraillerKeys/BraillerKeys";
import { Cell } from "../Cell/Cell";
import { ChordPad } from "../ChordPad/ChordPad";
import { ClearButton } from "../ClearButton/ClearButton";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { COURSES, Course } from "../../courses";
import {
  CellType,
  CLEAR_CELL,
  letterForCell,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import type { DotEntry } from "../../game/settings";
import { BackIcon } from "../Icons/Icons";
import "./Board.css";

type Reading = { course: Course; letter?: string };

const describeCell = (cells: CellType, readings: Reading[]): string => {
  const raised = raisedDots(cells);
  if (raised.length === 0) {
    return "Cell is empty.";
  }
  // Never end a sentence on a single letter: screen readers read "w." as an
  // abbreviation and run straight into the next sentence without a pause.
  const parts = readings.map(({ course, letter }) =>
    letter
      ? `${spokenLetter(letter, course.id)} in ${course.name}.`
      : `No ${course.name} letter.`
  );
  return `Dots ${raised.join(", ")} raised. ${parts.join(" ")}`;
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

type BoardProps = {
  dotEntry: DotEntry;
  /** Print key letters on the brailler keys. */
  showKeyLetters?: boolean;
  /** Back to Home. */
  onHome: () => void;
};

/** Explore: free play with one cell, every course's letter shown at once. */
export const Board = ({ dotEntry, showKeyLetters = true, onHome }: BoardProps) => {
  const [positions, setPositions] = React.useState<CellType>(CLEAR_CELL);

  // One result per course, so a new course file shows up here on its own.
  const readings: Reading[] = COURSES.map((course) => ({
    course,
    letter: letterForCell(positions, course.id),
  }));

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

  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => headingRef.current?.focus(), []);

  const helpId = React.useId();
  const withKeys = dotEntry === "keys";

  return (
    <div className="screen board">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Home" onClick={onHome}>
          <BackIcon />
        </button>
      </header>

      <div className="prompt-block">
        <p className="eyebrow">Explore · free play</p>
        <h2 ref={headingRef} tabIndex={-1} className="task">
          Raise dots, see the letter
        </h2>
      </div>

      <div className="hero">
        {withKeys ? (
          // Read-only: the keys below are the buttons, and the status
          // region says the dots in words.
          <Cell positions={positions} size="medium" />
        ) : (
          <Cell positions={positions} onClick={toggleDot} describedBy={helpId} />
        )}

        <dl className="results" aria-label="Translation">
          {readings.map(({ course, letter }) => {
            const spoken = letter && spokenLetter(letter, course.id);
            return (
              <Result
                key={course.id}
                label={course.name}
                lang={course.lang}
                letter={letter}
                spoken={spoken !== letter ? spoken : undefined}
              />
            );
          })}
        </dl>

        {withKeys ? (
          <BraillerKeysHelp id={helpId} />
        ) : (
          <>
            <p id={helpId} className="sr-only">
              Select a dot to raise or lower it. On a keyboard, press{" "}
              <kbd>1</kbd> to <kbd>6</kbd>, or type a whole letter as a chord in
              the braille keyboard below.
            </p>
            <ChordPad ref={padRef} />
          </>
        )}
      </div>

      <div className={withKeys ? "action base brailler-base" : "action"}>
        {withKeys && (
          <BraillerKeys
            ref={padRef}
            positions={positions}
            onToggleDot={toggleDot}
            onChord={setPositions}
            describedBy={helpId}
            showLetters={showKeyLetters}
          />
        )}
        <ClearButton onClick={clearCell} />
      </div>

      <p className="sr-only" role="status">
        {describeCell(positions, readings)}
      </p>
    </div>
  );
};
