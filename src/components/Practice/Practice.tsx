import React from "react";
import { getCourse, Lesson } from "../../courses";
import { Language } from "../../game/braille";
import type { DotEntry } from "../../game/settings";
import { coursePoints } from "../../game/lessons";
import {
  currentStreak,
  loadProgress,
  Progress,
  saveProgress,
} from "../../game/progress";
import { EVERYTHING, LessonList } from "./LessonList";
import { LessonPractice } from "./LessonPractice";
import { Score } from "./Score";

type PracticeProps = {
  /** The course, chosen on the Settings screen. */
  language: Language;
  dotEntry: DotEntry;
  /** Opens Settings at the course choice. */
  onChangeCourse: () => void;
  /** Injectable for deterministic tests. */
  random?: () => number;
  now?: () => Date;
};

// Two levels on one tab, without a router: the lesson list, and a lesson (or
// everything so far) that replaces it. The course is chosen in Settings.
type View =
  | { screen: "lessons"; returnTo?: string }
  | { screen: "lesson"; lessonId: string }
  | { screen: "everything" };

const defaultNow = () => new Date();

export const Practice = ({
  language,
  dotEntry,
  onChangeCourse,
  random = Math.random,
  now = defaultNow,
}: PracticeProps) => {
  const [progress, setProgress] = React.useState(() => loadProgress());
  const [view, setView] = React.useState<View>({ screen: "lessons" });
  const course = getCourse(language);

  const updateProgress = (next: Progress) => {
    setProgress(next);
    saveProgress(next);
  };

  const startLesson = (lesson: Lesson) =>
    setView({ screen: "lesson", lessonId: lesson.id });

  const score = (
    <Score
      points={progress.points}
      streak={currentStreak(progress, now())}
      course={{ name: course.name, points: coursePoints(course, progress) }}
    />
  );

  if (view.screen === "lessons") {
    return (
      <LessonList
        course={course}
        progress={progress}
        bar={
          <>
            <button
              type="button"
              className="clear-button"
              onClick={onChangeCourse}
            >
              Change course
            </button>
            {score}
          </>
        }
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
      progress={progress}
      onProgress={updateProgress}
      onBack={() => setView({ screen: "lessons", returnTo: key })}
      onStartLesson={startLesson}
      random={random}
      now={now}
    />
  );
};
