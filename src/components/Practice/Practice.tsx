import React from "react";
import { getCourse, Lesson } from "../../courses";
import { itemId, Language } from "../../game/braille";
import type { DotEntry } from "../../game/settings";
import { coursePoints } from "../../game/lessons";
import { currentStreak, Progress } from "../../game/progress";
import { CHANGE_COURSE, EVERYTHING, LessonList } from "./LessonList";
import { LessonIntro } from "./LessonIntro";
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
  /** Letter and number keys type dots (Settings > Keyboard). */
  keyShortcuts?: boolean;
  /** Kept by App, so Home shows the same points and streak. */
  progress: Progress;
  onProgress: (next: Progress) => void;
  /** Opens Settings at the course choice. */
  onChangeCourse: () => void;
  /** Back from the lesson list to Home. */
  onHome: () => void;
  /**
   * Leaving a lesson that was opened straight from Home goes back there, not
   * to a list the player never saw. Without it, leaving goes to the list.
   */
  onClose?: () => void;
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
  keyShortcuts = true,
  progress,
  onProgress,
  onChangeCourse,
  onHome,
  onClose,
  start = { screen: "lessons" },
  random = Math.random,
  now = defaultNow,
}: PracticeProps) => {
  const [view, setView] = React.useState<PracticeView>(start);
  const course = getCourse(language);

  // The letters of a lesson nobody has been asked about yet: they get a look
  // at their cards first.
  const newLetters = (lesson: Lesson) =>
    lesson.letters.filter((letter) => !progress.letters[itemId(course.id, letter)]);
  const [meeting, setMeeting] = React.useState<string | null>(() => {
    const first =
      start.screen === "lesson"
        ? course.lessons.find((entry) => entry.id === start.lessonId)
        : undefined;
    return first && newLetters(first).length > 0 ? first.id : null;
  });

  // Where leaving a lesson goes: the list once the player has been there,
  // or wherever the lesson was opened from.
  const [fromList, setFromList] = React.useState(start.screen === "lessons");
  // A finished lesson's "Back to lessons" goes to the list, wherever the
  // lesson was opened from.
  const toList = (key: string) => {
    setFromList(true);
    setView({ screen: "lessons", returnTo: key });
  };
  const leave = (key: string) => {
    if (!fromList && onClose) {
      onClose();
      return;
    }
    toList(key);
  };

  const startLesson = (lesson: Lesson) => {
    setMeeting(newLetters(lesson).length > 0 ? lesson.id : null);
    setView({ screen: "lesson", lessonId: lesson.id });
  };

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
  if (lesson && meeting === lesson.id) {
    return (
      <LessonIntro
        key={`${key}-meet`}
        course={course}
        lesson={lesson}
        letters={newLetters(lesson)}
        onStart={() => setMeeting(null)}
        onBack={() => leave(key)}
      />
    );
  }
  return (
    <LessonPractice
      // A new lesson is a new screen: fresh question, focus on its heading.
      key={key}
      course={course}
      lesson={lesson}
      dotEntry={dotEntry}
      showKeyLetters={showKeyLetters}
      keyShortcuts={keyShortcuts}
      progress={progress}
      onProgress={onProgress}
      onBack={() => leave(key)}
      onLessons={() => toList(key)}
      onStartLesson={startLesson}
      random={random}
      now={now}
    />
  );
};
