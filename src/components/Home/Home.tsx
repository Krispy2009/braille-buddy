import React from "react";
import type { Course } from "../../courses";
import {
  cellForLetter,
  CLEAR_CELL,
  DOT_KEYS,
  itemId,
  LANGUAGE_TAGS,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import { isLetterLearnt, lessonStates } from "../../game/lessons";
import { currentStreak, Progress } from "../../game/progress";
import { GearIcon } from "../Icons/Icons";
import { Letter } from "../Practice/Letter";
import { dotsInWords } from "../Practice/question";
import "./Home.css";

/** The Home button that opened a screen, focused again on the way back. */
export type HomeFocus = "settings" | "start" | "lessons" | "explore";

type HomeProps = {
  course: Course;
  progress: Progress;
  now: () => Date;
  /** Focus this button when Home opens (coming back from a screen). */
  focus?: HomeFocus;
  /** Opens the next lesson, or everything so far when every lesson is done. */
  onStart: (lessonId?: string) => void;
  onLessons: () => void;
  onExplore: () => void;
  onSettings: () => void;
};

const NUMBER_WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
];

const countWord = (count: number) => NUMBER_WORDS[count] ?? String(count);

/** "a, b and c", each letter marked with its language and named if needed. */
const LetterList = ({ letters, course }: { letters: string[]; course: Course }) => (
  <strong>
    {letters.map((letter, index) => (
      <React.Fragment key={letter}>
        {index > 0 && ", "}
        <Letter letter={letter} language={course.id} />
      </React.Fragment>
    ))}
  </strong>
);

/**
 * Home: the deck. The next card to learn is the hero, with one action to
 * press it; the lesson list, Explore and Settings are a quiet step away.
 * Points and streak live here and in results, never next to a question.
 */
export const Home = ({
  course,
  progress,
  now,
  focus,
  onStart,
  onLessons,
  onExplore,
  onSettings,
}: HomeProps) => {
  const root = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!focus) return;
    root.current
      ?.querySelector<HTMLElement>(`[data-return="${focus}"]`)
      ?.focus();
  }, [focus]);

  const learnt = (letter: string) => isLetterLearnt(progress, itemId(course.id, letter));
  const allLetters = course.lessons.flatMap((lesson) => lesson.letters);
  const learntTotal = allLetters.filter(learnt).length;

  const states = lessonStates(course, progress);
  const lesson = course.lessons[states.indexOf("open")];
  const toLearn = lesson ? lesson.letters.filter((letter) => !learnt(letter)) : [];
  const letter = toLearn[0] ?? lesson?.letters[0] ?? allLetters[0];
  const cell = cellForLetter(letter, course.id) ?? CLEAR_CELL;
  const isNew = !progress.letters[itemId(course.id, letter)];
  const number = String(allLetters.indexOf(letter) + 1).padStart(2, "0");
  const streak = currentStreak(progress, now());

  return (
    <div ref={root} className="screen home">
      <header className="home-header">
        <h1 className="wordmark">Braille Buddy</h1>
        <p className="home-stats">
          <span aria-hidden="true">
            day {streak} · {progress.points} pts
          </span>
          <span className="sr-only">
            Daily streak {streak} {streak === 1 ? "day" : "days"}, {progress.points} points
          </span>
        </p>
        <button
          type="button"
          className="round-button"
          aria-label="Settings"
          data-return="settings"
          onClick={onSettings}
        >
          <GearIcon />
        </button>
      </header>

      <h2 className="home-headline">
        Feel <br />
        the page.
      </h2>
      <p className="eyebrow">
        {course.name} · {learntTotal} of {allLetters.length} letters learnt
      </p>

      <div className="deck">
        <span className="deck-card deck-back-1" aria-hidden="true" />
        <span className="deck-card deck-back-2" aria-hidden="true" />
        <div
          className="deck-card deck-front"
          role="img"
          aria-label={`Card ${Number(number)}: ${spokenLetter(letter, course.id)}, ${dotsInWords(cell)}.`}
        >
          <span className="deck-card-top" aria-hidden="true">
            <span>card {number}</span>
            <span>{isNew ? "new" : learnt(letter) ? "learnt" : "practise"}</span>
          </span>
          <span className="deck-card-middle" aria-hidden="true">
            <span className="deck-letter" lang={LANGUAGE_TAGS[course.id]}>
              {letter}
            </span>
            <span className="deck-dots">
              {DOT_KEYS.map((dot) => (
                <span key={dot} className={cell[dot] ? "deck-dot raised" : "deck-dot"} />
              ))}
            </span>
          </span>
          <span className="deck-card-bottom" aria-hidden="true">
            dots {raisedDots(cell).join(" ")}
          </span>
        </div>
      </div>

      <p className="home-today">
        {!lesson ? (
          <>Every card in {course.name} is pressed. Mix them all to keep them sharp.</>
        ) : toLearn.length > 0 ? (
          <>
            {countWord(toLearn.length)} new {toLearn.length === 1 ? "card" : "cards"} to
            press today: <LetterList letters={toLearn} course={course} />.
          </>
        ) : (
          <>
            Finish {lesson.title}: <LetterList letters={lesson.letters} course={course} />.
          </>
        )}
      </p>
      <button
        type="button"
        className="quiet-button home-explore"
        data-return="explore"
        onClick={onExplore}
      >
        Explore the cell
      </button>

      <div className="home-base base">
        <span className="home-keys" aria-hidden="true">
          {(["dot3", "dot2", "dot1", "dot4", "dot5", "dot6"] as const).map((dot) => (
            <span key={dot} className={cell[dot] ? "home-key pressed" : "home-key"} />
          ))}
        </span>
        <div className="home-actions">
          <button
            type="button"
            className="key-button"
            data-return="start"
            onClick={() => onStart(lesson?.id)}
          >
            {lesson ? "Press new cards" : "Practise everything"}
          </button>
          <button
            type="button"
            className="outline-button"
            data-return="lessons"
            onClick={onLessons}
          >
            Lessons
          </button>
        </div>
      </div>
    </div>
  );
};
