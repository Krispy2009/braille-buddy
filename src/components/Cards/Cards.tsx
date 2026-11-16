import React from "react";
import type { Course, EntryKind } from "../../courses";
import { itemId, kindOfLetter, LANGUAGE_LABELS, LANGUAGES, Language } from "../../game/braille";
import { BackIcon } from "../Icons/Icons";
import { Letter } from "../Practice/Letter";
import { CardDeck } from "./CardDeck";
import "./Cards.css";

type CardsProps = {
  course: Course;
  /** Open on this card. The first one by default. */
  letter?: string;
  onLanguageChange: (language: Language) => void;
  /** Back to Home. */
  onHome: () => void;
};

const GROUPS: { kind: EntryKind; title: string }[] = [
  { kind: "letter", title: "Letters" },
  { kind: "number", title: "Numbers" },
  { kind: "punctuation", title: "Punctuation" },
];

/**
 * The library: every card in the course to flick through or jump to, for
 * learning a letter before (or without) being asked about it.
 */
export const Cards = ({ course, letter, onLanguageChange, onHome }: CardsProps) => {
  const letters = course.letters.map((entry) => entry.letter);
  const [index, setIndex] = React.useState(() => Math.max(letters.indexOf(letter ?? ""), 0));
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const shown = Math.min(index, letters.length - 1);

  React.useEffect(() => headingRef.current?.focus(), []);

  const jump = (to: number) => {
    setIndex(to);
    cardRef.current?.focus();
    cardRef.current?.scrollIntoView?.({ block: "center" });
  };

  return (
    <div className="screen cards">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Home" onClick={onHome}>
          <BackIcon />
        </button>
      </header>

      <div className="prompt-block">
        <p className="eyebrow">Cards · {course.name}</p>
        <h2 ref={headingRef} tabIndex={-1} className="task">
          Flick through the cards
        </h2>
      </div>

      <div className="card-courses" role="group" aria-label="Course">
        {LANGUAGES.map((language) => (
          <button
            key={language}
            type="button"
            className="outline-button"
            aria-pressed={language === course.id}
            onClick={() => {
              setIndex(0);
              onLanguageChange(language);
            }}
          >
            {LANGUAGE_LABELS[language]}
          </button>
        ))}
      </div>

      <CardDeck ref={cardRef} course={course} letters={letters} index={shown} onIndex={setIndex} />

      {GROUPS.map(({ kind, title }) => {
        const entries = letters.filter((entry) => kindOfLetter(entry, course.id) === kind);
        if (entries.length === 0) return null;
        return (
          <section key={kind} className="card-index" aria-label={title}>
            <h3 className="eyebrow">{title}</h3>
            <ul className="card-index-list">
              {entries.map((entry) => (
                <li key={itemId(course.id, entry)}>
                  <button
                    type="button"
                    className="card-index-button"
                    aria-current={letters[shown] === entry || undefined}
                    onClick={() => jump(letters.indexOf(entry))}
                  >
                    <Letter letter={entry} language={course.id} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
