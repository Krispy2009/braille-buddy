import React from "react";
import { getCourse, Lesson } from "../../courses";
import { Language } from "../../game/braille";
import { coursePoints } from "../../game/lessons";
import {
  currentStreak,
  loadProgress,
  Progress,
  saveProgress,
} from "../../game/progress";
import { LanguagePicker, loadLanguage, saveLanguage } from "./LanguagePicker";
import { EVERYTHING, LessonList } from "./LessonList";
import { LessonPractice } from "./LessonPractice";
import { Score } from "./Score";

type PracticeProps = {
  /** Injectable for deterministic tests. */
  random?: () => number;
  now?: () => Date;
};

// Three levels on one tab, without a router: the course radios and the lesson
// list share a screen, and a lesson (or everything so far) replaces it.
type View =
  | { screen: "lessons"; returnTo?: string }
  | { screen: "lesson"; lessonId: string }
  | { screen: "everything" };

const defaultNow = () => new Date();

export const Practice = ({
  random = Math.random,
  now = defaultNow,
}: PracticeProps) => {
  const [language, setLanguage] = React.useState<Language>(loadLanguage);
  const [progress, setProgress] = React.useState(() => loadProgress());
  const [view, setView] = React.useState<View>({ screen: "lessons" });
  const course = getCourse(language);

  const updateProgress = (next: Progress) => {
    setProgress(next);
    saveProgress(next);
  };

  const changeCourse = (next: Language) => {
    // Focus stays on the radio; the list below is read when the player
    // moves on to it.
    setLanguage(next);
    saveLanguage(next);
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
            <LanguagePicker language={language} onChange={changeCourse} />
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
      progress={progress}
      onProgress={updateProgress}
      score={score}
      onBack={() => setView({ screen: "lessons", returnTo: key })}
      onStartLesson={startLesson}
      random={random}
      now={now}
    />
  );
};
