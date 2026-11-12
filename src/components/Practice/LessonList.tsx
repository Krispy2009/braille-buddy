import React from "react";
import type { Course, Lesson } from "../../courses";
import { learntCount, lessonStates, metLetters } from "../../game/lessons";
import type { Progress } from "../../game/progress";
import { LessonCard } from "./LessonCard";

/** Stands for "Practise everything so far" where a lesson id would go. */
export const EVERYTHING = "(everything)";

type LessonListProps = {
  course: Course;
  progress: Progress;
  /** The way to change course and the score, shown above the list. */
  bar: React.ReactNode;
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

  React.useEffect(() => {
    if (!returnTo) return;
    const buttons = root.current?.querySelectorAll<HTMLElement>("[data-return]");
    [...(buttons ?? [])]
      .find((button) => button.dataset.return === returnTo)
      ?.focus();
  }, [returnTo]);

  return (
    <div ref={root} className="practice lessons">
      <div className="practice-bar">{bar}</div>

      <h2 id={headingId} className="lessons-heading">
        {course.name} lessons
      </h2>
      <p className="lessons-summary">
        {doneCount} of {course.lessons.length} lessons done.
      </p>

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
            className="clear-button"
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
