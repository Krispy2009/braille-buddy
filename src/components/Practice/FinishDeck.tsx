import type { CSSProperties } from "react";
import { cellsForLetter, DOT_KEYS, Language, LANGUAGE_TAGS } from "../../game/braille";

type FinishDeckProps = {
  letters: readonly string[];
  language: Language;
};

// Each card lands at its own small angle, like cards dropped on a pile.
// Kept within the fanned cards' ±8°, the only rotations the Press allows.
const TILTS = [-6, 3, -2, 5, -4, 2, -5, 4];

/**
 * A finished lesson's letters, dealt onto the deck as raised orange cards
 * with their dots. Shown, not read: the live region says which letters
 * were learnt.
 */
export const FinishDeck = ({ letters, language }: FinishDeckProps) => (
  <ul className="finish-deck" aria-hidden="true">
    {letters.map((letter, index) => (
      <li
        key={letter}
        className="finish-card"
        style={
          {
            "--tilt": `${TILTS[index % TILTS.length]}deg`,
            "--order": index,
          } as CSSProperties
        }
      >
        <span className="finish-letter" lang={LANGUAGE_TAGS[language]}>
          {letter}
        </span>
        <span className="finish-cells">
          {(cellsForLetter(letter, language) ?? []).map((cell, cellIndex) => (
            <span key={cellIndex} className="finish-dots">
              {DOT_KEYS.map((dot) => (
                <span key={dot} className={cell[dot] ? "finish-dot raised" : "finish-dot"} />
              ))}
            </span>
          ))}
        </span>
      </li>
    ))}
  </ul>
);
