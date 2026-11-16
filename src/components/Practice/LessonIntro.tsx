import React from "react";
import type { Course, Lesson } from "../../courses";
import { CloseIcon } from "../Icons/Icons";
import { CardDeck } from "../Cards/CardDeck";

type LessonIntroProps = {
  course: Course;
  lesson: Lesson;
  /** The lesson's letters that haven't been asked about yet. */
  letters: string[];
  onStart: () => void;
  onBack: () => void;
};

/**
 * Before a lesson asks anything, its new cards: look at each letter with its
 * dots, then practise. Teaching first, testing second.
 */
export const LessonIntro = ({ course, lesson, letters, onStart, onBack }: LessonIntroProps) => {
  const [index, setIndex] = React.useState(0);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => headingRef.current?.focus(), []);
  const noun = letters.length === 1 ? "card" : "cards";

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
      </header>
      <div className="prompt-block">
        <h2 ref={headingRef} tabIndex={-1} className="eyebrow lesson-heading">
          <span>
            {course.name}
            <span className="sr-only">:</span>
          </span>{" "}
          <span aria-hidden="true">· </span>
          {lesson.title}
        </h2>
        <h3 className="task prompt">Meet the new {noun}</h3>
        <p className="eyebrow">Look at each one first. Questions come next.</p>
      </div>
      <CardDeck course={course} letters={letters} index={index} onIndex={setIndex} />
      <div className="meet-actions">
        <button type="button" className="primary-button" onClick={onStart}>
          Start practising
        </button>
      </div>
    </div>
  );
};
