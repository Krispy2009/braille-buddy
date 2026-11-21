import React from "react";
import { getCourse } from "../../courses";
import {
  cellsForLetter,
  kindOfLetter,
  Language,
  LANGUAGE_TAGS,
} from "../../game/braille";
import { dotsInWords } from "../../game/cells";
import { Cell } from "../Cell/Cell";

/**
 * The course's alphabet on small cards, folded away in the puzzle. The puzzle
 * is open to everyone, so a player who has not met every letter yet can look
 * one up here instead of guessing.
 */
export const LetterLookup = ({ language }: { language: Language }) => {
  const course = getCourse(language);
  const letters = course.lessons
    .flatMap((lesson) => lesson.letters)
    .filter((letter) => kindOfLetter(letter, language) === "letter");
  // The cards are only drawn once the list is opened.
  const [open, setOpen] = React.useState(false);
  return (
    <details
      className="daily-lookup"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{open ? "Hide the letters" : "Look up a letter's dots"}</summary>
      {open && (
        <ul className="daily-lookup-list">
          {letters.map((letter) => {
            const cell = cellsForLetter(letter, language)?.[0];
            if (!cell) return null;
            return (
              <li key={letter} className="daily-lookup-letter">
                <span
                  className="daily-lookup-print"
                  lang={LANGUAGE_TAGS[language]}
                >
                  {letter}
                </span>
                <Cell positions={cell} size="small" />
                <span className="sr-only">: {dotsInWords(cell)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
};
