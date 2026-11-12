import React from "react";
import { getCourse, Lesson } from "../../courses";
import { Language } from "../../game/braille";
import type { DotEntry } from "../../game/settings";
import { coursePoints } from "../../game/lessons";
import { currentStreak, Progress } from "../../game/progress";
import { CHANGE_COURSE, EVERYTHING, LessonList } from "./LessonList";
import { LessonPractice } from "./LessonPractice";
import { Score } from "./Score";
import "./Practice.css";

/**
 * Two levels without a router: the lesson list, and a lesson (or everything
 * so far) that replaces it. Home can open either one directly.
 */
export type PracticeView =
  | { screen: "lessons"; returnTo?: string }
  | { screen: "lesson"; lessonId: string }
  | { screen: "everything" };

type PracticeProps = {
  /** The course, chosen on the Settings screen. */
  language: Language;
  dotEntry: DotEntry;
  /** Print key letters on the brailler keys. */
  showKeyLetters?: boolean;
  /** Kept by App, so Home shows the same points and streak. */
  progress: Progress;
  onProgress: (next: Progress) => void;
  /** Opens Settings at the course choice. */
  onChangeCourse: () => void;
  /** Back from the lesson list to Home. */
  onHome: () => void;
  /** Where to open. The lesson list by default. */
  start?: PracticeView;
  /** Injectable for deterministic tests. */
  random?: () => number;
  now?: () => Date;
};

const defaultNow = () => new Date();

export const Practice = ({
  language,
  dotEntry,
  showKeyLetters = true,
  progress,
  onProgress,
  onChangeCourse,
  onHome,
  start = { screen: "lessons" },
  random = Math.random,
  now = defaultNow,
}: PracticeProps) => {
  const [view, setView] = React.useState<PracticeView>(start);
  const course = getCourse(language);

  const startLesson = (lesson: Lesson) =>
    setView({ screen: "lesson", lessonId: lesson.id });

  if (view.screen === "lessons") {
    return (
      <LessonList
        course={course}
        progress={progress}
        bar={
          <>
            <Score
              points={progress.points}
              streak={currentStreak(progress, now())}
              course={{ name: course.name, points: coursePoints(course, progress) }}
            />
            <button
              data-return={CHANGE_COURSE}
              type="button"
              className="quiet-button"
              onClick={onChangeCourse}
            >
              Change course
            </button>
          </>
        }
        onHome={onHome}
        returnTo={view.returnTo}
        onStart={startLesson}
        onPractiseEverything={() => setView({ screen: "everything" })}
      />
    );
  }

  const lesson =
    view.screen === "lesson"
      ? course.lessons.find((entry) => entry.id === view.lessonId)
      : undefined;
  const key = lesson?.id ?? EVERYTHING;
  return (
    <LessonPractice
      // A new lesson is a new screen: fresh question, focus on its heading.
      key={key}
      course={course}
      lesson={lesson}
      dotEntry={dotEntry}
      showKeyLetters={showKeyLetters}
      progress={progress}
      onProgress={onProgress}
      onBack={() => setView({ screen: "lessons", returnTo: key })}
      onStartLesson={startLesson}
      random={random}
      now={now}
    />
  );
};
