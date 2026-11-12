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

export const Board = ({ dotEntry }: { dotEntry: DotEntry }) => {
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

  const helpId = React.useId();
  const withKeys = dotEntry === "keys";

  return (
    <div className="board">
      <div className="plate">
        {withKeys ? (
          // Read-only: the keys below are the buttons, and the status
          // region says the dots in words.
          <Cell positions={positions} />
        ) : (
          <Cell
            positions={positions}
            onClick={toggleDot}
            describedBy={helpId}
          />
        )}
      </div>

      {withKeys && (
        <BraillerKeys
          ref={padRef}
          positions={positions}
          onToggleDot={toggleDot}
          onChord={setPositions}
          describedBy={helpId}
        />
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

      <ClearButton onClick={clearCell} />

      {withKeys ? (
        <BraillerKeysHelp id={helpId} />
      ) : (
        <>
          <p id={helpId} className="help">
            Select a dot to raise or lower it. On a keyboard, press{" "}
            <kbd>1</kbd> to <kbd>6</kbd>, or type a whole letter as a chord in
            the braille keyboard below.
          </p>

          <ChordPad ref={padRef} />
        </>
      )}

      <p className="sr-only" role="status">
        {describeCell(positions, readings)}
      </p>
    </div>
  );
};
