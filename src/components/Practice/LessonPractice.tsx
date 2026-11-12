import React from "react";
import type { Course, Lesson } from "../../courses";
import {
  CellType,
  CLEAR_CELL,
  DotKey,
  itemId,
  LANGUAGE_TAGS,
  parseItemId,
  raisedDots,
} from "../../game/braille";
import {
  completeLesson,
  isLetterLearnt,
  lessonStates,
  metLetters,
} from "../../game/lessons";
import { Progress, recordAnswer } from "../../game/progress";
import type { DotEntry } from "../../game/settings";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { BraillerKeys, BraillerKeysHelp } from "../BraillerKeys/BraillerKeys";
import { Cell } from "../Cell/Cell";
import { ChordPad } from "../ChordPad/ChordPad";
import { ClearButton } from "../ClearButton/ClearButton";
import { Choices } from "./Choices";
import { Letter } from "./Letter";
import {
  Answer,
  answerCell,
  dotsInWords,
  Finished,
  finishedText,
  isRightCell,
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
  const [positions, setPositions] = React.useState<CellType>(CLEAR_CELL);
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

  const check = () => {
    if (!writing) return;
    if (raisedDots(positions).length === 0) {
      setStatus("Raise at least one dot, then check your answer.");
      return;
    }
    returnToPad.current = !!padRef.current?.contains(document.activeElement);
    finish({
      kind: "dots",
      correct: isRightCell(question.item, positions),
      cell: positions,
    });
  };

  const choose = (choice: string) => {
    if (!asking) return;
    finish({ kind: "letter", correct: choice === letter, choice });
  };

  const goNext = () => {
    const next = makeQuestion(source, progress, question.item, random);
    setQuestion(next);
    setPositions(CLEAR_CELL);
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
      setPositions((current) => ({ ...current, [dot]: !current[dot] }));
    }
  };

  useBrailleKeys({
    onToggleDot: toggleDot,
    onChord: (cell) => writing && setPositions(cell),
    onClear: () => writing && setPositions(CLEAR_CELL),
    onSubmit: () => (asking ? check() : goNext()),
    chordArea: padRef,
  });

  const nextLesson = finished && !finished.courseDone ? finished.next : undefined;

  return (
    <div className="practice">
      <div className="practice-bar">
        <button type="button" className="clear-button" onClick={onBack}>
          Back to lessons
        </button>
      </div>

      {/* A plain div, not a labelled section: a region named after the heading
          would have its name read twice when focus lands on the heading. */}
      <div className="lesson-practice">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="lesson-heading"
        >
          <span className="lesson-course">
            {course.name}
            <span className="sr-only">:</span>
          </span>{" "}
          {title}
        </h2>
        {/* Shown, not announced: the result already says how the answer
            went, and a lesson finishing gets its own sentence. */}
        <p className="lesson-learnt">
          {learnt} of {source.letters.length} letters learnt
        </p>

        <h3 id={promptId} ref={promptRef} tabIndex={-1} className="prompt">
          {question.kind === "dots" ? (
            <>
              Write the {[...letter].length > 1 ? "letters" : "letter"}{" "}
              <Letter letter={letter} language={language} className="target" />{" "}
              in braille
            </>
          ) : (
            <>Which letter has {dotsInWords(answerCell(question.item))}?</>
          )}
        </h3>

        <div className="plate">
          {writing && !withKeys ? (
            <Cell positions={positions} onClick={toggleDot} describedBy={promptId} />
          ) : (
            <Cell
              positions={
                question.kind === "dots" ? positions : answerCell(question.item)
              }
            />
          )}
        </div>

        {withKeys && (
          <BraillerKeys
            ref={padRef}
            positions={positions}
            onToggleDot={toggleDot}
            onChord={setPositions}
            describedBy={`${promptId} ${keysHelpId}`}
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

        <p role="status" className="feedback">
          {status}
        </p>

        {answer ? (
          <>
            {answer.kind === "dots" && !answer.correct && (
              <div className="answer-card" aria-hidden="true">
                <span className="answer-label">Answer</span>
                <span className="letter" lang={LANGUAGE_TAGS[language]}>
                  {letter}
                </span>
                <div className="plate small">
                  <Cell positions={answerCell(question.item)} size="small" />
                </div>
              </div>
            )}
            {finished && (
              <div className="actions lesson-finished">
                {nextLesson && (
                  <button
                    ref={finishRef}
                    type="button"
                    className="primary-button"
                    onClick={() => onStartLesson(nextLesson)}
                  >
                    Next lesson
                  </button>
                )}
                <button
                  ref={nextLesson ? undefined : finishRef}
                  type="button"
                  className={nextLesson ? "clear-button" : "primary-button"}
                  onClick={onBack}
                >
                  Back to lessons
                </button>
              </div>
            )}
            <button
              ref={nextRef}
              type="button"
              className={finished ? "clear-button next-button" : "primary-button next-button"}
              onClick={goNext}
            >
              {finished ? "Keep practising" : "Next question"}
            </button>
          </>
        ) : (
          question.kind === "dots" && (
            <>
              <div className="actions">
                <button type="button" className="primary-button" onClick={check}>
                  Check
                </button>
                <ClearButton onClick={() => setPositions(CLEAR_CELL)} />
              </div>
              {withKeys ? (
                <BraillerKeysHelp id={keysHelpId} canSubmit />
              ) : (
                <ChordPad ref={padRef} canSubmit describedBy={promptId} />
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};
