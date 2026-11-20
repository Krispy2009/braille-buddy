import React from "react";
import type { Course } from "../../courses";
import {
  cellsForLetter,
  CLEAR_CELL,
  DOT_KEYS,
  itemId,
  kindOfLetter,
  LANGUAGE_TAGS,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import { isLetterLearnt, lessonStates } from "../../game/lessons";
import { currentStreak, Progress } from "../../game/progress";
import { GearIcon, PersonIcon } from "../Icons/Icons";
import { Letter } from "../Practice/Letter";
import { cellsInWords } from "../../game/cells";
import type { DailyStatus } from "../../daily/storage";
import "./Home.css";

/** The Home button that opened a screen, focused again on the way back. */
export type HomeFocus = "settings" | "account" | "start" | "lessons" | "explore" | "daily" | "cards";

type HomeProps = {
  course: Course;
  progress: Progress;
  now: () => Date;
  /** Focus this button when Home opens (coming back from a screen). */
  focus?: HomeFocus;
  /** Today's daily puzzle, or undefined when the course has none. */
  daily?: DailyStatus;
  onDaily: () => void;
  /** Opens the next lesson, or everything so far when every lesson is done. */
  onStart: (lessonId?: string) => void;
  onLessons: () => void;
  onExplore: () => void;
  /** Opens the card library, on this card. */
  onCards: (letter?: string) => void;
  onSettings: () => void;
  /** Whether a player is signed in; undefined when accounts are off. */
  account?: "signedIn" | "signedOut";
  onAccount?: () => void;
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
  daily,
  onDaily,
  onStart,
  onLessons,
  onExplore,
  onCards,
  onSettings,
  account,
  onAccount,
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
  // Letters only: numbers and punctuation have lessons of their own.
  const alphabet = allLetters.filter((entry) => kindOfLetter(entry, course.id) === "letter");
  const learntTotal = alphabet.filter(learnt).length;

  const states = lessonStates(course, progress);
  const lesson = course.lessons[states.indexOf("open")];
  const toLearn = lesson ? lesson.letters.filter((letter) => !learnt(letter)) : [];
  const letter = toLearn[0] ?? lesson?.letters[0] ?? allLetters[0];
  // A number is two cells: the card shows its last, the digit, and says all.
  const cells = cellsForLetter(letter, course.id) ?? [CLEAR_CELL];
  const cell = cells[cells.length - 1];
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
        {account && onAccount && (
          <button
            type="button"
            className="round-button home-account"
            aria-label={account === "signedIn" ? "Account, signed in" : "Account"}
            data-signed-in={account === "signedIn"}
            data-return="account"
            onClick={onAccount}
          >
            <PersonIcon />
          </button>
        )}
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
        Six dots. <br />
        Every letter.
      </h2>
      <p className="eyebrow">
        {course.name} · {learntTotal} of {alphabet.length} letters learnt
      </p>
      <p className="home-note">
        Braille Buddy teaches the dot patterns of braille. Reading by touch
        takes practice with real embossed braille, ideally with a braille
        teacher or a local blindness organisation.
      </p>

      <div className="deck">
        <span className="deck-card deck-back-1" aria-hidden="true" />
        <span className="deck-card deck-back-2" aria-hidden="true" />
        <button
          type="button"
          className="deck-card deck-front"
          data-return="cards"
          aria-label={`Card ${Number(number)}: ${spokenLetter(letter, course.id)}, ${cellsInWords(cells)}. Open the cards.`}
          onClick={() => onCards(letter)}
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
            dots {cells.map((each) => raisedDots(each).join(" ")).join(", ")}
          </span>
        </button>
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
      {daily && (
        <section className="daily-card" aria-labelledby="daily-card-title">
          <div className="daily-card-head">
            <h3 id="daily-card-title" className="daily-card-title">
              Daily puzzle
            </h3>
            <span className="daily-card-state" data-done={daily.done}>
              <span aria-hidden="true">{daily.done ? "✓" : "○"}</span>{" "}
              {daily.done ? "Done today" : "Not done yet"}
            </span>
          </div>
          <p className="daily-card-text">
            {daily.done
              ? `${daily.result}. A new puzzle comes at midnight.`
              : "Read a word in braille, then write one. The same puzzle for everyone today."}
          </p>
          <button
            type="button"
            className="outline-button daily-card-button"
            data-return="daily"
            onClick={onDaily}
          >
            {daily.done
              ? "See today's result"
              : daily.started
                ? "Carry on with today's puzzle"
                : "Play today's puzzle"}
          </button>
        </section>
      )}
      <div className="home-links">
        <button
          type="button"
          className="quiet-button"
          data-return="cards"
          onClick={() => onCards()}
        >
          All the cards
        </button>
        <button
          type="button"
          className="quiet-button"
          data-return="explore"
          onClick={onExplore}
        >
          Explore the cell
        </button>
      </div>

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
