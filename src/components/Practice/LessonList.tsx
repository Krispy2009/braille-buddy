import React from "react";
import type { Course, Lesson } from "../../courses";
import { learntCount, lessonStates, metLetters } from "../../game/lessons";
import type { Progress } from "../../game/progress";
import { BackIcon } from "../Icons/Icons";
import { LessonCard } from "./LessonCard";

/** Stands for "Practise everything so far" where a lesson id would go. */
export const EVERYTHING = "(everything)";
/** Stands for the "Change course" button, back from Settings. */
export const CHANGE_COURSE = "(course)";

type LessonListProps = {
  course: Course;
  progress: Progress;
  /** The way to change course and the score, shown above the list. */
  bar: React.ReactNode;
  /** Back to Home. */
  onHome: () => void;
  /**
   * The lesson id (or EVERYTHING) the player just came back from. Its button
   * takes focus, so they carry on from where they were.
   */
  returnTo?: string;
  onStart: (lesson: Lesson) => void;
  onPractiseEverything: () => void;
};

export const LessonList = ({
  course,
  progress,
  bar,
  onHome,
  returnTo,
  onStart,
  onPractiseEverything,
}: LessonListProps) => {
  const headingId = React.useId();
  const everythingId = React.useId();
  const root = React.useRef<HTMLDivElement>(null);
  const states = lessonStates(course, progress);
  const doneCount = states.filter((state) => state === "done").length;
  const met = metLetters(course, progress);

  const headingRef = React.useRef<HTMLHeadingElement>(null);

  // Opening the list focuses its heading; coming back from a lesson focuses
  // that lesson's button instead, so the player carries on from there.
  React.useEffect(() => {
    if (!returnTo) {
      headingRef.current?.focus();
      return;
    }
    const buttons = root.current?.querySelectorAll<HTMLElement>("[data-return]");
    [...(buttons ?? [])]
      .find((button) => button.dataset.return === returnTo)
      ?.focus();
  }, [returnTo]);

  return (
    <div ref={root} className="screen lessons">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Home" onClick={onHome}>
          <BackIcon />
        </button>
      </header>
      <div className="prompt-block">
        <p className="eyebrow lessons-summary">
          {doneCount} of {course.lessons.length} lessons done.
        </p>
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="task">
          {course.name} lessons
        </h2>
      </div>
      <div className="practice-bar">{bar}</div>

      <ol className="lesson-list" aria-labelledby={headingId}>
        {course.lessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            language={course.id}
            state={states[index]}
            learnt={learntCount(course, lesson, progress)}
            before={course.lessons[index - 1]}
            onStart={() => onStart(lesson)}
          />
        ))}
      </ol>

      {doneCount > 0 && (
        <div className="everything-card">
          <p id={everythingId}>
            {doneCount === course.lessons.length
              ? `Mix all ${met.length} letters in the course.`
              : `Mix the ${met.length} letters from your finished lessons and the next one.`}
          </p>
          <button
            data-return={EVERYTHING}
            type="button"
            className="outline-button"
            aria-describedby={everythingId}
            onClick={onPractiseEverything}
          >
            Practise everything so far
          </button>
        </div>
      )}
    </div>
  );
};
