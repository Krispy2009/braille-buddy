import React from "react";
import { DailyPuzzle, hintText, letterMarks, MAX_TRIES, wordCells, wordLetters } from "../../daily/daily";
import { LANGUAGE_TAGS } from "../../game/braille";
import { dotsInWords } from "../../game/cells";
import { CellRow } from "../Cell/CellRow";
import { LetterLookup } from "./LetterLookup";
import { Tries, TryRow } from "./Tries";
import { Word } from "./Word";

type ReadHalfProps = {
  puzzle: DailyPuzzle;
  /** Normalised words typed so far. */
  tries: readonly string[];
  solved: boolean;
  finished: boolean;
  status: string;
  /** Returns true when the guess was taken as a try. */
  onGuess: (text: string) => boolean;
  headingRef: React.Ref<HTMLHeadingElement>;
};

/** Part 1: the word in braille cells; the player types it in print. */
export const ReadHalf = ({
  puzzle,
  tries,
  solved,
  finished,
  status,
  onGuess,
  headingRef,
}: ReadHalfProps) => {
  const language = puzzle.course;
  const [text, setText] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();
  const promptId = React.useId();
  const statusId = React.useId();
  const cells = wordCells(puzzle.read, language);
  const answer = wordLetters(puzzle.read);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onGuess(text)) {
      // Kept to edit for the next try, selected so typing replaces it.
      inputRef.current?.select();
    }
  };

  const rows: TryRow[] = tries.map((guess) => {
    const marks = letterMarks(guess, puzzle.read);
    const guessed = wordLetters(guess);
    const length = Math.max(guessed.length, answer.length);
    return {
      places: Array.from({ length }, (_, at) => guessed[at] ?? "_"),
      marks: Array.from({ length }, (_, at) => marks[at] ?? false),
      text: (
        <>
          <span lang={LANGUAGE_TAGS[language]}>{guess}</span>.{" "}
          {guess === puzzle.read ? "Right." : hintText(marks, guessed.length)}
        </>
      ),
    };
  });

  return (
    <div className="daily-half">
      <h3 ref={headingRef} tabIndex={-1} className="task">
        Read it
      </h3>
      <p className="eyebrow">
        Part 1 of 2
        {!finished && ` · try ${tries.length + 1} of ${MAX_TRIES}`}
      </p>
      <p id={promptId} className="daily-prompt">
        What word do these {cells.length} braille cells spell?
      </p>
      <CellRow cells={cells} size="medium" />
      <ol className="sr-only" aria-label="The cells in words">
        {cells.map((cell, index) => (
          <li key={index}>
            Cell {index + 1}: {dotsInWords(cell)}
          </li>
        ))}
      </ol>

      <Tries rows={rows} label="Your tries" />
      {!finished && <LetterLookup language={language} />}

      {finished ? (
        <p className="daily-answer">
          {solved ? "Yes! " : "The word is "}
          <Word word={puzzle.read} language={language} />
        </p>
      ) : (
        <form className="daily-form" onSubmit={submit}>
          <label htmlFor={inputId} className="daily-label">
            Type the word in print
          </label>
          <div className="daily-input-row">
            <input
              ref={inputRef}
              id={inputId}
              className="daily-input"
              type="text"
              lang={LANGUAGE_TAGS[language]}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-describedby={`${promptId} ${statusId}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" className="primary-button daily-check">
              Check
            </button>
          </div>
        </form>
      )}
      <p id={statusId} role="status" className={finished ? "sr-only" : "feedback daily-status"}>
        {status}
      </p>
    </div>
  );
};
