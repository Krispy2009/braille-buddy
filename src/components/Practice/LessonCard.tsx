import React from "react";
import type { Lesson } from "../../courses";
import type { Language } from "../../game/braille";
import type { LessonState } from "../../game/lessons";
import { Letter } from "./Letter";

type LessonCardProps = {
  lesson: Lesson;
  language: Language;
  state: LessonState;
  learnt: number;
  /** The lesson that has to be finished first, for a locked lesson. */
  before?: Lesson;
  onStart: () => void;
};

const STATE_LABELS: Record<LessonState, string> = {
  done: "Done",
  open: "Next",
  locked: "Locked",
};

const buttonText = (state: LessonState, learnt: number): string => {
  if (state === "done") return "Practise again";
  return state === "open" && learnt > 0 ? "Continue" : "Start";
};

export const LessonCard = ({
  lesson,
  language,
  state,
  learnt,
  before,
  onStart,
}: LessonCardProps) => {
  const id = React.useId();
  const titleId = `${id}-title`;
  const buttonId = `${id}-button`;
  const detailsId = `${id}-details`;
  const locked = state === "locked";

  return (
    <li className="lesson-card" data-state={state}>
      <div className="lesson-card-head">
        <h3 id={titleId} className="lesson-title">
          {lesson.title}
        </h3>
        {/* The state in words, so it never rests on the border style alone.
            Hidden here because the button's description already says it. */}
        <span className="chip lesson-state" aria-hidden="true">
          {STATE_LABELS[state]}
        </span>
      </div>
      <p className="lesson-letters">
        <span className="sr-only">Letters:</span>{" "}
        {lesson.letters.map((letter, index) => (
          <React.Fragment key={letter}>
            {index > 0 && <span className="sr-only">,</span>}{" "}
            <Letter letter={letter} language={language} />
          </React.Fragment>
        ))}
      </p>
      <p id={detailsId} className="lesson-details">
        <span className="sr-only">{STATE_LABELS[state]}.</span>{" "}
        {locked && before
          ? `Finish ${before.title} first.`
          : `${learnt} of ${lesson.letters.length} letters learnt.`}
      </p>
      {/* A locked lesson keeps a focusable button with aria-disabled rather
          than the disabled attribute: disabled would drop it from the Tab
          order and leave keyboard and screen reader users unaware it exists
          or why it is shut, while this way they hear "Start Letters f to j,
          unavailable, Locked. Finish Letters a to e first." */}
      <button
        data-return={lesson.id}
        id={buttonId}
        type="button"
        className={state === "open" ? "primary-button" : "clear-button"}
        aria-labelledby={`${buttonId} ${titleId}`}
        aria-describedby={detailsId}
        aria-disabled={locked || undefined}
        onClick={locked ? undefined : onStart}
      >
        {buttonText(state, learnt)}
      </button>
    </li>
  );
};
