import React from "react";
import type { Course, Lesson } from "../../courses";
import {
  cellsForLetter,
  CellType,
  CLEAR_CELL,
  DotKey,
  itemId,
  kindOfLetter,
  LANGUAGE_TAGS,
  parseItemId,
  raisedDots,
} from "../../game/braille";
import {
  CellEntry,
  clearCurrentCell,
  currentCell,
  dotsInWords,
  entryLabel,
  firstEmptyCell,
  isLastCell,
  moveToCell,
  nextCell,
  previousCell,
  setCurrentCell,
  startEntry,
  toggleEntryDot,
} from "../../game/cells";
import {
  completeLesson,
  entriesNoun,
  isLetterLearnt,
  lessonStates,
  metLetters,
} from "../../game/lessons";
import { currentStreak, Progress, recordAnswer } from "../../game/progress";
import type { DotEntry } from "../../game/settings";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { BraillerKeys, BraillerKeysHelp } from "../BraillerKeys/BraillerKeys";
import { Cell } from "../Cell/Cell";
import { CellRow } from "../Cell/CellRow";
import { ChordPad } from "../ChordPad/ChordPad";
import { ClearButton } from "../ClearButton/ClearButton";
import { CloseIcon } from "../Icons/Icons";
import { Choices } from "./Choices";
import { Letter } from "./Letter";
import {
  Answer,
  answerCells,
  choicePrompt,
  Finished,
  finishedText,
  isRightCells,
  makeQuestion,
  Question,
  QuestionSource,
  resultText,
} from "./question";

type LessonPracticeProps = {
  course: Course;
  /** Leave out to practise every letter met so far. */
  lesson?: Lesson;
  dotEntry: DotEntry;
  showKeyLetters: boolean;
  keyShortcuts: boolean;
  progress: Progress;
  onProgress: (next: Progress) => void;
  onBack: () => void;
  onStartLesson: (lesson: Lesson) => void;
  random: () => number;
  now: () => Date;
};

type FocusTarget = "heading" | "prompt" | "next" | "pad" | "finish";

// Fixed when the screen opens: a lesson finished halfway through "everything
// so far" must not slip letters the player hasn't been taught into the mix.
const sourceFor = (
  course: Course,
  lesson: Lesson | undefined,
  progress: Progress
): QuestionSource => {
  const met = metLetters(course, progress);
  return lesson
    ? { language: course.id, letters: lesson.letters, others: met }
    : { language: course.id, letters: met, others: [] };
};

/** Checks whether this answer finished the lesson the letter belongs to. */
const finishLesson = (
  course: Course,
  letter: string,
  progress: Progress
): { progress: Progress; finished?: Finished } => {
  const index = course.lessons.findIndex((lesson) =>
    lesson.letters.includes(letter)
  );
  if (index < 0) return { progress };
  const lesson = course.lessons[index];
  const next = completeLesson(course, lesson, progress);
  if (next === progress) return { progress };
  return {
    progress: next,
    finished: {
      lesson,
      next: course.lessons[index + 1],
      courseDone: lessonStates(course, next).every((state) => state === "done"),
    },
  };
};

export const LessonPractice = ({
  course,
  lesson,
  dotEntry,
  showKeyLetters,
  keyShortcuts,
  progress,
  onProgress,
  onBack,
  onStartLesson,
  random,
  now,
}: LessonPracticeProps) => {
  const language = course.id;
  const [source] = React.useState(() => sourceFor(course, lesson, progress));
  const [question, setQuestion] = React.useState<Question>(() =>
    makeQuestion(source, progress, undefined, random)
  );
  // What the player is writing: one cell for a letter, more for a number
  // or a two-cell sign.
  const [entry, setEntry] = React.useState<CellEntry>(() =>
    startEntry(answerCells(question.item).length)
  );
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const [finished, setFinished] = React.useState<Finished | null>(null);
  const [status, setStatus] = React.useState("");
  // Opening the screen moves focus to its heading, so a screen reader says
  // which lesson this is before anything else.
  const [focusRequest, setFocusRequest] = React.useState<{
    target: FocusTarget;
  }>({ target: "heading" });

  const promptId = React.useId();
  const keysHelpId = React.useId();
  const cellLabelId = React.useId();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const promptRef = React.useRef<HTMLHeadingElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const finishRef = React.useRef<HTMLButtonElement>(null);
  const padRef = React.useRef<HTMLDivElement>(null);
  // Chord typists who answered from the pad (or the brailler keys) go back
  // to it, so they don't have to Tab past six dots and two buttons for
  // every question.
  const returnToPad = React.useRef(false);

  React.useEffect(() => {
    const refs = {
      heading: headingRef,
      prompt: promptRef,
      next: nextRef,
      pad: padRef,
      finish: finishRef,
    };
    (refs[focusRequest.target].current ?? promptRef.current)?.focus();
  }, [focusRequest]);

  const { letter } = parseItemId(question.item);
  const asking = answer === null;
  const writing = asking && question.kind === "dots";
  const withKeys = writing && dotEntry === "keys";
  const title = lesson ? lesson.title : "Everything so far";
  const learnt = source.letters.filter((entry) =>
    isLetterLearnt(progress, itemId(language, entry))
  ).length;
  const noun = entriesNoun(course, source.letters);
  const answerDots = answerCells(question.item);
  // Numbers and two-cell signs are written one cell at a time.
  const multi = answerDots.length > 1;
  const positions = currentCell(entry);

  const finish = (result: Answer) => {
    const answered = recordAnswer(progress, question.item, result.correct, now());
    const outcome = finishLesson(course, letter, answered);
    onProgress(outcome.progress);
    setAnswer(result);
    setFinished(outcome.finished ?? null);
    // The result goes to the live region only. Focus moves to a button whose
    // name doesn't repeat it, so nothing is read twice.
    setStatus(
      outcome.finished
        ? `${resultText(question.item, result)} ${finishedText(course, outcome.finished)}`
        : resultText(question.item, result)
    );
    setFocusRequest({ target: outcome.finished ? "finish" : "next" });
  };

  // Moving between cells is said in the live region, since focus stays on
  // the dots: "Cell 2 of 2, no dots raised."
  const goToCell = (next: CellEntry) => {
    setEntry(next);
    const cell = currentCell(next);
    setStatus(
      `${entryLabel(next)}, ${
        raisedDots(cell).length === 0 ? "no dots raised" : `${dotsInWords(cell)} raised`
      }.`
    );
  };

  const check = () => {
    if (!writing) return;
    const empty = firstEmptyCell(entry);
    if (empty >= 0) {
      if (multi) {
        setEntry(moveToCell(entry, empty));
        setStatus(
          `Raise at least one dot in cell ${empty + 1}, then check your answer.`
        );
      } else {
        setStatus("Raise at least one dot, then check your answer.");
      }
      return;
    }
    returnToPad.current = !!padRef.current?.contains(document.activeElement);
    finish({
      kind: "dots",
      correct: isRightCells(question.item, entry.cells),
      cells: [...entry.cells],
    });
  };

  /** Enter and the main button: the next cell, or check on the last one. */
  const submit = () => {
    if (!writing) return;
    if (isLastCell(entry)) {
      check();
      return;
    }
    if (raisedDots(positions).length === 0) {
      setStatus(`Raise at least one dot in cell ${entry.current + 1} first.`);
      return;
    }
    goToCell(nextCell(entry));
  };

  const choose = (choice: string) => {
    if (!asking) return;
    finish({ kind: "letter", correct: choice === letter, choice });
  };

  const goNext = () => {
    const next = makeQuestion(source, progress, question.item, random);
    setQuestion(next);
    setEntry(startEntry(answerCells(next.item).length));
    setAnswer(null);
    setFinished(null);
    setStatus("");
    // The question is read by moving focus to it, not by the live region.
    setFocusRequest({
      target: next.kind === "dots" && returnToPad.current ? "pad" : "prompt",
    });
  };

  const toggleDot = (dot: DotKey) => {
    if (writing) {
      setEntry((current) => toggleEntryDot(current, dot));
    }
  };

  const setPositions = (cell: CellType) =>
    setEntry((current) => setCurrentCell(current, cell));

  useBrailleKeys({
    onToggleDot: toggleDot,
    onChord: (cell) => writing && setPositions(cell),
    onClear: () => writing && setEntry(clearCurrentCell),
    onSubmit: () => (asking ? submit() : goNext()),
    keyShortcuts,
  });

  const nextLesson = finished && !finished.courseDone ? finished.next : undefined;
  const total = source.letters.length;
  const right = answer?.correct === true;
  const wrong = answer !== null && !answer.correct;
  const kind = kindOfLetter(letter, language);
  // The cell label is part of what the dots describe, so a screen reader
  // hears "Cell 1 of 2" with the question.
  const describedBy = multi ? `${promptId} ${cellLabelId}` : promptId;

  // The action area is one element throughout, so the live region inside it
  // is never remounted: while writing it is the brailler base (or a plain
  // row), once answered it becomes the feedback sheet.
  const actionClass = answer
    ? `action sheet ${right ? "sheet-right" : "sheet-wrong base"}`
    : withKeys
      ? "action base brailler-base"
      : "action";

  // On the black base the main button is a key; elsewhere it is black.
  const mainButton = wrong ? "key-button" : "primary-button";

  return (
    <div className="screen lesson">
      <header className="frame">
        <button
          type="button"
          className="round-button"
          aria-label="Back to lessons"
          onClick={onBack}
        >
          <CloseIcon />
        </button>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} learnt`}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={learnt}
          aria-valuetext={`${learnt} of ${total} ${noun} learnt`}
        >
          <span
            className="progress-fill"
            style={{ width: `${total ? (learnt / total) * 100 : 0}%` }}
          />
        </div>
        <span className="progress-count" aria-hidden="true">
          {learnt}/{total}
        </span>
      </header>

      {/* A plain div, not a labelled section: a region named after the heading
          would have its name read twice when focus lands on the heading. */}
      <div className="prompt-block">
        <h2 ref={headingRef} tabIndex={-1} className="eyebrow lesson-heading">
          <span>
            {course.name}
            <span className="sr-only">:</span>
          </span>{" "}
          <span aria-hidden="true">· </span>
          {title}
        </h2>
        <h3 id={promptId} ref={promptRef} tabIndex={-1} className="task prompt">
          {question.kind === "dots" ? (
            kind === "letter" ? (
              <>
                Write the {[...letter].length > 1 ? "letters" : "letter"}{" "}
                <Letter letter={letter} language={language} className="letter-chip" />{" "}
                in braille
              </>
            ) : (
              // Read as "Write number 7 in braille" or "Write the question
              // mark in braille": the spoken name says what it is.
              <>
                Write {kind === "punctuation" && "the "}
                <Letter letter={letter} language={language} className="letter-chip" />{" "}
                in braille
              </>
            )
          ) : (
            choicePrompt(question.item)
          )}
        </h3>
      </div>

      <div className="hero">
        {writing && multi && (
          <>
            <p id={cellLabelId} className="eyebrow cell-position">
              {entryLabel(entry)}
            </p>
            <CellRow
              cells={entry.cells}
              current={entry.current}
              onSelect={(index) => goToCell(moveToCell(entry, index))}
              label="Cells of your answer"
            />
          </>
        )}
        {writing && !withKeys ? (
          <Cell positions={positions} onClick={toggleDot} describedBy={describedBy} />
        ) : writing ? (
          <Cell positions={positions} size="medium" />
        ) : (
          <CellRow
            cells={question.kind === "dots" ? entry.cells : answerDots}
            // After the answer the cells make room for the feedback sheet.
            size="medium"
          />
        )}
        {question.kind === "letter" && (
          <Choices
            choices={question.choices}
            language={language}
            answer={letter}
            chosen={answer?.kind === "letter" ? answer.choice : undefined}
            labelledBy={promptId}
            onChoose={choose}
          />
        )}
        {writing && !withKeys && keyShortcuts && (
          <ChordPad ref={padRef} canSubmit describedBy={describedBy} />
        )}
        {withKeys && (
          <>
            <p className="eyebrow keys-hint" aria-hidden="true">
              tap keys one by one or together
            </p>
            <BraillerKeysHelp id={keysHelpId} canSubmit shortcuts={keyShortcuts} />
          </>
        )}
      </div>

      <div className={actionClass}>
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
        {/* Shown, not announced: the result in words follows. */}
        {answer && (
          <div className="sheet-head" aria-hidden="true">
            {right ? (
              <span className="stamp">
                {answer.kind === "dots" ? "Pressed it" : "Got it"}
              </span>
            ) : (
              <span className="cross">
                <CloseIcon />
              </span>
            )}
          </div>
        )}
        <p role="status" className="feedback">
          {status}
        </p>
        {answer && !answer.correct && (
          <div className="compare" aria-hidden="true">
            <div className="compare-side">
              <span className="compare-label">
                {answer.kind === "dots" ? (
                  "You pressed"
                ) : (
                  <>
                    You chose{" "}
                    <span lang={LANGUAGE_TAGS[language]}>{answer.choice}</span>
                  </>
                )}
              </span>
              <CellRow
                cells={
                  answer.kind === "dots"
                    ? answer.cells
                    : (cellsForLetter(answer.choice, language) ?? [CLEAR_CELL])
                }
                size="small"
              />
            </div>
            <div className="compare-side">
              <span className="compare-label">
                Answer <span lang={LANGUAGE_TAGS[language]}>{letter}</span>
              </span>
              <CellRow cells={answerDots} size="small" />
            </div>
          </div>
        )}
        {finished && (
          <p className="eyebrow totals">
            Lesson done · {progress.points} pts · day {currentStreak(progress, now())}
          </p>
        )}
        {finished && nextLesson && (
          <button
            ref={finishRef}
            type="button"
            className={mainButton}
            onClick={() => onStartLesson(nextLesson)}
          >
            Next lesson
          </button>
        )}
        {answer ? (
          <div className={finished ? "sheet-links" : "sheet-next"}>
            {finished && (
              <button
                ref={nextLesson ? undefined : finishRef}
                type="button"
                className={nextLesson ? "quiet-button" : mainButton}
                onClick={onBack}
              >
                Back to lessons
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              className={finished ? "quiet-button" : mainButton}
              onClick={goNext}
            >
              {finished ? "Keep practising" : "Next question"}
            </button>
          </div>
        ) : (
          question.kind === "dots" && (
            <>
              <button
                type="button"
                className={withKeys ? "key-button" : "primary-button"}
                onClick={submit}
              >
                {isLastCell(entry) ? "Press it" : "Next cell"}
              </button>
              {multi && entry.current > 0 && (
                <button
                  type="button"
                  className={withKeys ? "quiet-button" : "outline-button"}
                  onClick={() => goToCell(previousCell(entry))}
                >
                  Previous cell
                </button>
              )}
              <ClearButton onClick={() => setPositions(CLEAR_CELL)} />
            </>
          )
        )}
      </div>
    </div>
  );
};
