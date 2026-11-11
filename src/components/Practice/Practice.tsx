import React from "react";
import {
  CellType,
  CLEAR_CELL,
  DotKey,
  Language,
  LANGUAGE_TAGS,
  parseItemId,
  raisedDots,
} from "../../game/braille";
import {
  currentStreak,
  loadProgress,
  recordAnswer,
  saveProgress,
} from "../../game/progress";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { Cell } from "../Cell/Cell";
import { ChordPad } from "../ChordPad/ChordPad";
import { ClearButton } from "../ClearButton/ClearButton";
import { Choices } from "./Choices";
import { LanguagePicker, loadLanguage, saveLanguage } from "./LanguagePicker";
import { Letter } from "./Letter";
import {
  Answer,
  answerCell,
  dotsInWords,
  isRightCell,
  makeQuestion,
  Question,
  resultText,
} from "./question";
import { Score } from "./Score";

type PracticeProps = {
  /** Injectable for deterministic tests. */
  random?: () => number;
  now?: () => Date;
};

type FocusTarget = "prompt" | "next" | "pad";

const defaultNow = () => new Date();

export const Practice = ({
  random = Math.random,
  now = defaultNow,
}: PracticeProps) => {
  const [language, setLanguage] = React.useState<Language>(loadLanguage);
  const [progress, setProgress] = React.useState(() => loadProgress());
  const [question, setQuestion] = React.useState<Question>(() =>
    makeQuestion(language, progress, undefined, random)
  );
  const [positions, setPositions] = React.useState<CellType>(CLEAR_CELL);
  const [answer, setAnswer] = React.useState<Answer | null>(null);
  const [status, setStatus] = React.useState("");
  const [focusRequest, setFocusRequest] = React.useState<{
    target: FocusTarget;
  } | null>(null);

  const promptId = React.useId();
  const promptRef = React.useRef<HTMLHeadingElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const padRef = React.useRef<HTMLDivElement>(null);
  // Chord typists who answered from the pad go back to it, so they don't
  // have to Tab past six dots and two buttons for every question.
  const returnToPad = React.useRef(false);

  React.useEffect(() => {
    if (!focusRequest) return;
    const refs = { prompt: promptRef, next: nextRef, pad: padRef };
    (refs[focusRequest.target].current ?? promptRef.current)?.focus();
  }, [focusRequest]);

  const { letter } = parseItemId(question.item);
  const asking = answer === null;
  const writing = asking && question.kind === "dots";

  const finish = (result: Answer) => {
    const next = recordAnswer(progress, question.item, result.correct, now());
    setProgress(next);
    saveProgress(next);
    setAnswer(result);
    // The result goes to the live region only. Focus moves to Next, whose
    // name doesn't repeat it, so nothing is read twice.
    setStatus(resultText(question.item, result));
    setFocusRequest({ target: "next" });
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

  const startQuestion = (next: Question) => {
    setQuestion(next);
    setPositions(CLEAR_CELL);
    setAnswer(null);
    setStatus("");
  };

  const goNext = () => {
    const next = makeQuestion(language, progress, question.item, random);
    startQuestion(next);
    // The question is read by moving focus to it, not by the live region.
    setFocusRequest({
      target: next.kind === "dots" && returnToPad.current ? "pad" : "prompt",
    });
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    saveLanguage(next);
    // Focus stays on the radio. The new question is the label of the cell
    // or of the choices, so it is read when the player moves on to them.
    startQuestion(makeQuestion(next, progress, undefined, random));
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

  return (
    <div className="practice">
      <div className="practice-bar">
        <LanguagePicker language={language} onChange={changeLanguage} />
        <Score points={progress.points} streak={currentStreak(progress, now())} />
      </div>

      <h2 id={promptId} ref={promptRef} tabIndex={-1} className="prompt">
        {question.kind === "dots" ? (
          <>
            Write the {[...letter].length > 1 ? "letters" : "letter"}{" "}
            <Letter letter={letter} language={language} className="target" />{" "}
            in braille
          </>
        ) : (
          <>Which letter has {dotsInWords(answerCell(question.item))}?</>
        )}
      </h2>

      <div className="plate">
        {writing ? (
          <Cell positions={positions} onClick={toggleDot} describedBy={promptId} />
        ) : (
          <Cell
            positions={question.kind === "dots" ? positions : answerCell(question.item)}
          />
        )}
      </div>

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
          <button
            ref={nextRef}
            type="button"
            className="primary-button"
            onClick={goNext}
          >
            Next question
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
            <ChordPad ref={padRef} canSubmit describedBy={promptId} />
          </>
        )
      )}
    </div>
  );
};
