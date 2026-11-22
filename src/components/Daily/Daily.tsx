import React from "react";
import type { Course } from "../../courses";
import {
  attemptsFor,
  cellMarks,
  cellsToGuess,
  dailyPoints,
  DailyPuzzle,
  dailyPuzzle,
  formatDay,
  halfResult,
  hintText,
  letterMarks,
  MAX_TRIES,
  normaliseGuess,
  spellWord,
  triesLeftText,
  wordCells,
  wordLetters,
} from "../../daily/daily";
import { DailyRecord, loadDaily, saveDaily } from "../../daily/storage";
import type { CellType } from "../../game/braille";
import { cellsInWords } from "../../game/cells";
import { currentStreak, Progress, recordDailyPuzzle } from "../../game/progress";
import type { DotEntry } from "../../game/settings";
import { useEscape } from "../../hooks/useEscape";
import { BackIcon } from "../Icons/Icons";
import { DailyResult } from "./DailyResult";
import { ReadHalf } from "./ReadHalf";
import { WriteHalf } from "./WriteHalf";
import "../Practice/Practice.css";
import "./Daily.css";

type DailyProps = {
  course: Course;
  dotEntry: DotEntry;
  showKeyLetters: boolean;
  keyShortcuts: boolean;
  progress: Progress;
  onProgress: (next: Progress) => void;
  /** Back to Home. */
  onBack: () => void;
  now: () => Date;
};

type Step = "read" | "write" | "result";

/** "cat (c, a, t)": a word for the live region, spelled as it is written. */
const sayWord = (word: string, language: string) =>
  `${word} (${spellWord(word, language)})`;
type FocusTarget = "heading" | "step" | "continue";

/**
 * The daily puzzle: read a word in braille, then write another, with up to
 * three tries each, then a result to share. The day is fixed when the screen
 * opens, so a puzzle started before midnight can still be finished after.
 */
export const Daily = (props: DailyProps) => {
  const [puzzle] = React.useState(() => dailyPuzzle(props.course.id, props.now()));
  if (!puzzle) {
    return (
      <DailyFrame onBack={props.onBack} context={props.course.name}>
        <p>There is no daily puzzle for {props.course.name} yet.</p>
      </DailyFrame>
    );
  }
  return <DailyGame {...props} puzzle={puzzle} />;
};

/**
 * The frame holds only the way out, as on every screen. The heading is the
 * screen's eyebrow, "Daily puzzle · English · Saturday 21 November", and each
 * half's task follows it, as a lesson's heading and question do.
 */
const DailyFrame = ({
  onBack,
  headingRef,
  context,
  children,
}: {
  onBack: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  /** The course, and the day: said after "Daily puzzle". */
  context: React.ReactNode;
  children: React.ReactNode;
}) => {
  const ownRef = React.useRef<HTMLHeadingElement>(null);
  const ref = headingRef ?? ownRef;
  React.useEffect(() => {
    if (!headingRef) ownRef.current?.focus();
  }, [headingRef]);
  // Escape goes back, like the Back button. Not from a field with typing in it.
  useEscape(onBack);
  return (
    <div className="screen daily">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
      </header>
      <div className="prompt-block daily-prompt-block">
        <h2 ref={ref} tabIndex={-1} className="eyebrow daily-heading">
          <span>
            Daily puzzle
            <span className="sr-only">:</span>
          </span>{" "}
          <span aria-hidden="true">· </span>
          {context}
        </h2>
      </div>
      {children}
    </div>
  );
};

const firstStep = (puzzle: DailyPuzzle, record: DailyRecord): Step => {
  const attempts = attemptsFor(puzzle, record);
  if (!halfResult(attempts.read).finished) return "read";
  if (!halfResult(attempts.write).finished) return "write";
  return "result";
};

const DailyGame = ({
  course,
  puzzle,
  dotEntry,
  showKeyLetters,
  keyShortcuts,
  progress,
  onProgress,
  onBack,
  now,
}: DailyProps & { puzzle: DailyPuzzle }) => {
  const language = puzzle.course;
  const [record, setRecord] = React.useState(() => loadDaily(puzzle.day, language));
  const [step, setStep] = React.useState<Step>(() => firstStep(puzzle, record));
  const [status, setStatus] = React.useState("");
  // Opening the screen moves focus to its heading.
  const [focus, setFocus] = React.useState<{ target: FocusTarget }>({ target: "heading" });
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const stepRef = React.useRef<HTMLHeadingElement>(null);
  const continueRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const refs = { heading: headingRef, step: stepRef, continue: continueRef };
    refs[focus.target].current?.focus();
  }, [focus]);

  const attempts = attemptsFor(puzzle, record);
  const read = halfResult(attempts.read);
  const write = halfResult(attempts.write);

  const save = (next: DailyRecord) => {
    setRecord(next);
    saveDaily(puzzle.day, language, next);
  };

  const guessRead = (text: string): boolean => {
    const guess = normaliseGuess(text);
    if (!guess) {
      setStatus("Type the word first, then check it.");
      return false;
    }
    if (record.read.includes(guess)) {
      setStatus("You tried that word already. Change a letter and check again.");
      return false;
    }
    const tries = [...record.read, guess];
    save({ ...record, read: tries });
    const word = sayWord(puzzle.read, language);
    if (guess === puzzle.read) {
      setStatus(`Yes! The word is ${word}.`);
    } else if (tries.length >= MAX_TRIES) {
      setStatus(`Not this time. The word is ${word}.`);
    } else {
      const marks = letterMarks(guess, puzzle.read);
      setStatus(
        `Not quite. ${hintText(marks, wordLetters(guess).length)} ${triesLeftText(tries.length)}`
      );
      return true;
    }
    setFocus({ target: "continue" });
    return true;
  };

  const checkWrite = (cells: CellType[]): boolean[] | undefined => {
    const guess = cellsToGuess(cells);
    if (record.write.includes(guess)) {
      setStatus("You tried those cells already. Change a letter and check again.");
      return undefined;
    }
    const tries = [...record.write, guess];
    const next: DailyRecord = { ...record, write: tries };
    const marks = cellMarks(guess, puzzle.write, language);
    const result = halfResult(attemptsFor(puzzle, next).write);
    if (result.finished && !record.rewarded) {
      next.rewarded = true;
      onProgress(recordDailyPuzzle(progress, dailyPoints(read, result), now()));
    }
    save(next);
    const answer = cellsInWords(wordCells(puzzle.write, language));
    if (result.solved) {
      setStatus(`Yes! You wrote ${sayWord(puzzle.write, language)} in braille.`);
    } else if (result.finished) {
      setStatus(`Not this time. In braille, ${sayWord(puzzle.write, language)} is ${answer}.`);
    } else {
      setStatus(`Not quite. ${hintText(marks)} ${triesLeftText(tries.length)}`);
      return marks;
    }
    setFocus({ target: "continue" });
    return marks;
  };

  const goTo = (next: Step) => {
    setStep(next);
    setStatus("");
    setFocus({ target: "step" });
  };

  return (
    <DailyFrame
      onBack={onBack}
      headingRef={headingRef}
      context={
        <>
          {course.name}
          <span className="sr-only">,</span> <span aria-hidden="true">· </span>
          {formatDay(puzzle.day)}
        </>
      }
    >
      {step === "read" && (
        <ReadHalf
          puzzle={puzzle}
          tries={record.read}
          solved={read.solved}
          finished={read.finished}
          status={status}
          onGuess={guessRead}
          headingRef={stepRef}
        />
      )}
      {step === "write" && (
        <WriteHalf
          puzzle={puzzle}
          tries={record.write}
          solved={write.solved}
          finished={write.finished}
          status={status}
          onStatus={setStatus}
          onCheck={checkWrite}
          dotEntry={dotEntry}
          showKeyLetters={showKeyLetters}
          keyShortcuts={keyShortcuts}
          headingRef={stepRef}
        />
      )}
      {step === "result" && (
        <DailyResult
          puzzle={puzzle}
          courseName={course.name}
          read={attempts.read}
          write={attempts.write}
          earned={dailyPoints(read, write)}
          points={progress.points}
          streak={currentStreak(progress, now())}
          onBack={onBack}
          headingRef={stepRef}
        />
      )}
      {step === "read" && read.finished && (
        <button
          ref={continueRef}
          type="button"
          className="primary-button daily-continue"
          onClick={() => goTo("write")}
        >
          Go on to Write it
        </button>
      )}
      {step === "write" && write.finished && (
        <button
          ref={continueRef}
          type="button"
          className="primary-button daily-continue"
          onClick={() => goTo("result")}
        >
          See today's result
        </button>
      )}
    </DailyFrame>
  );
};
