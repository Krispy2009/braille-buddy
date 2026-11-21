import React from "react";
import { type Course, type EntryKind, getCourse } from "../../courses";
import { itemId, kindOfLetter, LANGUAGE_LABELS, LANGUAGES, Language } from "../../game/braille";
import { BackIcon } from "../Icons/Icons";
import { Letter } from "../Practice/Letter";
import { CardDeck } from "./CardDeck";
import "./Cards.css";

type CardsProps = {
  /** The player's course: the deck opens on it. */
  course: Course;
  /** Open on this card. The first one by default. */
  letter?: string;
  /** Back to Home. */
  onHome: () => void;
};

const GROUPS: { kind: EntryKind; title: string }[] = [
  { kind: "letter", title: "Letters" },
  { kind: "number", title: "Numbers" },
  { kind: "punctuation", title: "Punctuation" },
];

/** Lower case, without accents, and a final sigma as a plain one: "Ά" is "α". */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace("ς", "σ")
    .toLocaleLowerCase();

/**
 * The library: every card in the course to flick through or jump to, for
 * learning a letter before (or without) being asked about it. The other
 * decks are a tap away, for a look only: the course itself is chosen in
 * Settings, so browsing Greek cards never moves Home or the lessons.
 */
export const Cards = ({ course: ownCourse, letter, onHome }: CardsProps) => {
  const [language, setLanguage] = React.useState<Language>(ownCourse.id);
  const course = language === ownCourse.id ? ownCourse : getCourse(language);
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

  // Typing a letter, digit or sign opens its card, with no need to find it
  // in the index. A pair such as "ου" opens on its first letter.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      if ([...event.key].length !== 1 || event.key === " ") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const typed = plain(event.key);
      const found = letters.findIndex((entry) => plain(entry).startsWith(typed));
      if (found < 0) return;
      event.preventDefault();
      setIndex(found);
      cardRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [letters]);

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

      <div className="card-courses" role="group" aria-label="Deck">
        {LANGUAGES.map((option) => (
          <button
            key={option}
            type="button"
            className="outline-button"
            aria-pressed={option === course.id}
            onClick={() => {
              setIndex(0);
              setLanguage(option);
            }}
          >
            {LANGUAGE_LABELS[option]}
          </button>
        ))}
      </div>

      <CardDeck ref={cardRef} course={course} letters={letters} index={shown} onIndex={setIndex} />

      {/* Beside the card on a wide window. */}
      <div className="card-library">
        <p className="eyebrow card-hint">
          On a keyboard, type a letter to jump to its card, or use the left and right
          arrow keys.
        </p>

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
    </div>
  );
};
