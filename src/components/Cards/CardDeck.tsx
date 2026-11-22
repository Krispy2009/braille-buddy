import React from "react";
import type { Course } from "../../courses";
import {
  cellsForLetter,
  CLEAR_CELL,
  DOT_KEYS,
  LANGUAGE_TAGS,
  raisedDots,
  spokenLetter,
} from "../../game/braille";
import { cellsInWords } from "../../game/cells";
import "./Cards.css";

type CardDeckProps = {
  course: Course;
  /** The entries to flick through, by their print form. */
  letters: string[];
  index: number;
  onIndex: (index: number) => void;
  /** On the card, so the screen can move focus to it. */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * Previous and Next under the card. A screen with its own turning buttons
   * (the lesson intro) leaves them out.
   */
  turnButtons?: boolean;
  /** Said after the card, in the same announcement. */
  note?: string;
};

/** How far a finger has to travel sideways to turn the card. */
const SWIPE = 40;

/**
 * One big card at a time: the letter, its cell, and its dots in words, with
 * Previous and Next. Arrow keys and a swipe turn the card as well, so there
 * are three ways to flick and none of them is the only one.
 */
export const CardDeck = ({
  course,
  letters,
  index,
  onIndex,
  ref,
  turnButtons = true,
  note,
}: CardDeckProps) => {
  const swipeFrom = React.useRef<number | null>(null);
  const letter = letters[index];
  const cells = cellsForLetter(letter, course.id) ?? [CLEAR_CELL];
  const number = String(index + 1).padStart(2, "0");
  const first = index === 0;
  const last = index === letters.length - 1;
  const go = (to: number) => onIndex(Math.min(Math.max(to, 0), letters.length - 1));

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div className="card-deck">
      <div
        ref={ref}
        tabIndex={-1}
        className="flash-card"
        onKeyDown={onKeyDown}
        onPointerDown={(event) => (swipeFrom.current = event.clientX)}
        onPointerUp={(event) => {
          if (swipeFrom.current === null) return;
          const moved = event.clientX - swipeFrom.current;
          swipeFrom.current = null;
          if (Math.abs(moved) >= SWIPE) go(index + (moved < 0 ? 1 : -1));
        }}
        onPointerCancel={() => (swipeFrom.current = null)}
      >
        <span className="deck-card-top" aria-hidden="true">
          <span>card {number}</span>
          <span>
            {index + 1} of {letters.length}
          </span>
        </span>
        <span className="deck-card-middle" aria-hidden="true">
          <span
            className="deck-letter flash-letter"
            data-long={[...letter].length > 1 || undefined}
            lang={LANGUAGE_TAGS[course.id]}
          >
            {letter}
          </span>
          <span className="flash-cells">
            {cells.map((cell, position) => (
              <span key={position} className="deck-dots">
                {DOT_KEYS.map((dot) => (
                  <span key={dot} className={cell[dot] ? "deck-dot raised" : "deck-dot"} />
                ))}
              </span>
            ))}
          </span>
        </span>
        <span className="deck-card-bottom" aria-hidden="true">
          dots {cells.map((each) => raisedDots(each).join(" ")).join(", ")}
        </span>
        {/* Said once per card: the letter, then where its dots are. */}
        <span className="sr-only" role="status">
          Card {index + 1} of {letters.length}: {spokenLetter(letter, course.id)},{" "}
          {cellsInWords(cells)}.{note && ` ${note}`}
        </span>
      </div>
      {turnButtons && (
        <div className="card-turn">
          <button
            type="button"
            className="outline-button"
            disabled={first}
            onClick={() => go(index - 1)}
          >
            Previous card
          </button>
          <button
            type="button"
            className="outline-button"
            disabled={last}
            onClick={() => go(index + 1)}
          >
            Next card
          </button>
        </div>
      )}
    </div>
  );
};
