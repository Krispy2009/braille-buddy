import React from "react";
import {
  cellMarks,
  DailyPuzzle,
  hintText,
  MAX_TRIES,
  wordCells,
  wordLetters,
} from "../../daily/daily";
import {
  bitmapToCell,
  CellType,
  CLEAR_CELL,
  DotKey,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import {
  CellEntry,
  cellsInWords,
  clearCurrentCell,
  currentCell,
  dotsInWords,
  firstEmptyCell,
  isLastCell,
  moveToCell,
  nextCell,
  previousCell,
  setCurrentCell,
  startEntry,
  toggleEntryDot,
} from "../../game/cells";
import type { DotEntry } from "../../game/settings";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { BraillerKeys, BraillerKeysHelp } from "../BraillerKeys/BraillerKeys";
import { Cell } from "../Cell/Cell";
import { CellRow } from "../Cell/CellRow";
import { ChordPad } from "../ChordPad/ChordPad";
import { ClearButton } from "../ClearButton/ClearButton";
import { Letter } from "../Practice/Letter";
import { Tries, TryRow } from "./Tries";
import { Word } from "./Word";

type WriteHalfProps = {
  puzzle: DailyPuzzle;
  /** Written words so far, as `cellsToGuess` gives them. */
  tries: readonly string[];
  solved: boolean;
  finished: boolean;
  status: string;
  onStatus: (status: string) => void;
  /**
   * Checks a written word. Returns whether each cell was right when it was
   * taken as a try, or undefined when it wasn't (tried before).
   */
  onCheck: (cells: CellType[]) => boolean[] | undefined;
  dotEntry: DotEntry;
  showKeyLetters: boolean;
  keyShortcuts: boolean;
  headingRef: React.Ref<HTMLHeadingElement>;
};

const toCells = (guess: string): CellType[] => guess.split(" ").map(bitmapToCell);

/** "Letter 2 of 4" */
const letterLabel = (index: number, count: number) => `Letter ${index + 1} of ${count}`;

/**
 * Part 2: a word in print; the player writes it cell by cell with their own
 * way of raising dots, as in a lesson. After a wrong try the cells stay, and
 * the first one to look at again is selected.
 */
export const WriteHalf = ({
  puzzle,
  tries,
  solved,
  finished,
  status,
  onStatus,
  onCheck,
  dotEntry,
  showKeyLetters,
  keyShortcuts,
  headingRef,
}: WriteHalfProps) => {
  const language = puzzle.course;
  const letters = wordLetters(puzzle.write);
  const answer = wordCells(puzzle.write, language);
  const [entry, setEntry] = React.useState<CellEntry>(() => {
    const last = tries[tries.length - 1];
    return last ? { cells: toCells(last), current: 0 } : startEntry(letters.length);
  });
  const promptId = React.useId();
  const labelId = React.useId();
  const keysHelpId = React.useId();
  const padRef = React.useRef<HTMLDivElement>(null);

  const writing = !finished;
  const withKeys = writing && dotEntry === "keys";
  const positions = currentCell(entry);
  const describedBy = `${promptId} ${labelId}`;

  // Focus stays on the dots, so moving between letters is said here.
  const goToCell = (next: CellEntry) => {
    setEntry(next);
    const cell = currentCell(next);
    onStatus(
      `${letterLabel(next.current, next.cells.length)}, ${spokenLetter(
        letters[next.current],
        language
      )}: ${raisedDots(cell).length === 0 ? "no dots raised" : `${dotsInWords(cell)} raised`}.`
    );
  };

  const check = () => {
    const empty = firstEmptyCell(entry);
    if (empty >= 0) {
      setEntry(moveToCell(entry, empty));
      onStatus(`Raise at least one dot for letter ${empty + 1}, then check the word.`);
      return;
    }
    const marks = onCheck([...entry.cells]);
    const wrong = marks?.indexOf(false) ?? -1;
    if (wrong >= 0) setEntry(moveToCell(entry, wrong));
  };

  /** Enter and the main button: the next letter, or check on the last one. */
  const submit = () => {
    if (!writing) return;
    if (isLastCell(entry)) {
      check();
    } else if (raisedDots(positions).length === 0) {
      onStatus(`Raise at least one dot for letter ${entry.current + 1} first.`);
    } else {
      goToCell(nextCell(entry));
    }
  };

  const toggleDot = (dot: DotKey) => {
    if (writing) setEntry((current) => toggleEntryDot(current, dot));
  };

  const setPositions = (cell: CellType) => {
    if (writing) setEntry((current) => setCurrentCell(current, cell));
  };

  useBrailleKeys({
    onToggleDot: toggleDot,
    onChord: setPositions,
    onClear: () => writing && setEntry(clearCurrentCell),
    onSubmit: submit,
    enabled: writing,
    keyShortcuts,
  });

  const rows: TryRow[] = tries.map((guess) => {
    const marks = cellMarks(guess, puzzle.write, language);
    return {
      places: toCells(guess).map((cell, at) => <Cell key={at} positions={cell} size="small" />),
      marks,
      text: marks.every(Boolean) ? "Right." : hintText(marks),
    };
  });

  return (
    <div className="daily-half">
      <h3 ref={headingRef} tabIndex={-1} className="task">
        Write it
      </h3>
      <p className="eyebrow">
        Part 2 of 2
        {writing && ` · try ${tries.length + 1} of ${MAX_TRIES}`}
      </p>
      <p id={promptId} className="daily-prompt">
        Write <Word word={puzzle.write} language={language} /> in braille, one
        cell for each letter.
      </p>

      {writing && (
        <div className="hero daily-hero">
          <p id={labelId} className="eyebrow cell-position">
            {letterLabel(entry.current, entry.cells.length)}:{" "}
            <Letter letter={letters[entry.current]} language={language} />
          </p>
          <CellRow
            cells={entry.cells}
            current={entry.current}
            onSelect={(index) => goToCell(moveToCell(entry, index))}
            label="Letters of your answer"
          />
          {withKeys ? (
            <Cell positions={positions} size="medium" />
          ) : (
            <Cell positions={positions} onClick={toggleDot} describedBy={describedBy} />
          )}
          {!withKeys && keyShortcuts && (
            <ChordPad ref={padRef} canSubmit describedBy={describedBy} />
          )}
          {withKeys && (
            <BraillerKeysHelp id={keysHelpId} canSubmit shortcuts={keyShortcuts} />
          )}
        </div>
      )}

      <Tries rows={rows} label="Your tries" />

      {finished && (
        <div className="daily-answer">
          <p>
            {solved ? "You wrote " : "Here is "}
            <Word word={puzzle.write} language={language} /> in braille:{" "}
            {cellsInWords(answer)}.
          </p>
          <CellRow cells={answer} size="small" />
        </div>
      )}

      <p role="status" className="feedback daily-status">
        {status}
      </p>

      {writing && (
        <div className={withKeys ? "action base brailler-base" : "action"}>
          {withKeys && (
            <BraillerKeys
              ref={padRef}
              positions={positions}
              onToggleDot={toggleDot}
              onChord={setPositions}
              describedBy={`${describedBy} ${keysHelpId}`}
              showLetters={showKeyLetters}
              shortcuts={keyShortcuts}
            />
          )}
          <button
            type="button"
            className={withKeys ? "key-button" : "primary-button"}
            onClick={submit}
          >
            {isLastCell(entry) ? "Check word" : "Next letter"}
          </button>
          {entry.current > 0 && (
            <button
              type="button"
              className={withKeys ? "quiet-button" : "outline-button"}
              onClick={() => goToCell(previousCell(entry))}
            >
              Previous letter
            </button>
          )}
          <ClearButton onClick={() => setPositions(CLEAR_CELL)} />
        </div>
      )}
    </div>
  );
};
