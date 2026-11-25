import React from "react";
import type { Course, Lesson } from "../../courses";
import { CloseIcon } from "../Icons/Icons";
import { CardStack } from "../Cards/CardStack";
import { entriesNoun } from "../../game/lessons";
import { useEscape } from "../../hooks/useEscape";

type LessonIntroProps = {
  course: Course;
  lesson: Lesson;
  /** The lesson's letters that haven't been asked about yet. */
  letters: string[];
  onStart: () => void;
  onBack: () => void;
};

/** Controls that use the arrow keys themselves keep them. */
const OWNS_ARROWS =
  "input, textarea, select, [contenteditable], [role=slider], [role=spinbutton], " +
  "[role=radio], [role=radiogroup], [role=tab], [role=tablist], [role=listbox], " +
  "[role=option], [role=menu], [role=menuitem], [role=combobox], [role=grid]";

/**
 * Before a lesson asks anything, its new cards: look at each letter with its
 * dots, then practise. Teaching first, testing second.
 *
 * One card at a time, in a stack a finger can flick, and every card is seen
 * before practice starts: the
 * main button says Next card until the last card, then Start practising.
 * Once every card has been seen, going back keeps a quiet Start practising
 * below, so checking one letter again never means stepping through the rest.
 * (A lesson whose letters have all been asked about skips this screen.)
 */
export const LessonIntro = ({ course, lesson, letters, onStart, onBack }: LessonIntroProps) => {
  const [index, setIndex] = React.useState(0);
  // The furthest card reached: everything up to it has been seen.
  const [furthest, setFurthest] = React.useState(0);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const previousRef = React.useRef<HTMLButtonElement>(null);
  const mainRef = React.useRef<HTMLButtonElement>(null);
  const quietRef = React.useRef<HTMLButtonElement>(null);
  const refocus = React.useRef(false);
  React.useEffect(() => headingRef.current?.focus(), []);
  const noun = letters.length === 1 ? "card" : "cards";
  // "letter", "number" or "sign", for the rule.
  const item = entriesNoun(course, lesson.letters).slice(0, -1);
  const lastIndex = letters.length - 1;
  const onLast = index === lastIndex;
  const allSeen = furthest === lastIndex;

  const turn = (to: number) => {
    const next = Math.min(Math.max(to, 0), lastIndex);
    if (next === index) return;
    // A button about to go (Previous on the first card, the quiet Start
    // practising on the last) hands focus to the main button, which does
    // the same job there.
    const active = document.activeElement;
    if (
      (next === 0 && active === previousRef.current) ||
      (next === lastIndex && active === quietRef.current)
    ) {
      refocus.current = true;
    }
    setIndex(next);
    setFurthest((seen) => Math.max(seen, next));
  };

  React.useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    mainRef.current?.focus();
  }, [index]);

  // Left and right turn the cards from anywhere on the screen, not only
  // with focus on the card. They aren't character keys, so the Keyboard
  // shortcuts switch (WCAG 2.1.4) doesn't cover them, and a screen reader
  // in browse mode keeps its arrows anyway.
  // Escape closes the lesson, like the close button.
  useEscape(onBack);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(OWNS_ARROWS)) return;
      event.preventDefault();
      turn(index + (event.key === "ArrowRight" ? 1 : -1));
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="screen lesson">
      <header className="frame">
        <button
          type="button"
          className="round-button"
          aria-label="Close lesson"
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
        <p className="lesson-note">
          Look at each one first. Then get each {item} right twice to finish
          the lesson. A wrong answer never takes away a right one.
        </p>
      </div>
      <CardStack
        course={course}
        letters={letters}
        index={index}
        onIndex={turn}
        label={`New ${noun}`}
        note={onLast && lastIndex > 0 ? "That's the last new card." : undefined}
      />
      {lastIndex > 0 && (
        <p className="eyebrow card-hint meet-hint">
          On a keyboard, the left and right arrow keys turn the cards.
        </p>
      )}
      <div className="meet-actions">
        <div className={lastIndex > 0 ? "meet-turn" : "meet-turn single"}>
          {lastIndex > 0 && (
            <button
              ref={previousRef}
              type="button"
              className="outline-button"
              disabled={index === 0}
              onClick={() => turn(index - 1)}
            >
              Previous card
            </button>
          )}
          {/* One button whose label changes, so focus stays on it. Both
              labels sit in the same spot, so it keeps its size. */}
          <button
            ref={mainRef}
            type="button"
            className="primary-button meet-main"
            onClick={onLast ? onStart : () => turn(index + 1)}
          >
            <span className="meet-label" aria-hidden={!onLast || undefined}>
              Start practising
            </span>
            <span className="meet-label" aria-hidden={onLast || undefined}>
              Next card
            </span>
          </button>
        </div>
        <div className="meet-quiet">
          {allSeen && !onLast && (
            <button ref={quietRef} type="button" className="quiet-button" onClick={onStart}>
              Start practising
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
