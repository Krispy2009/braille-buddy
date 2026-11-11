import { Language } from "../../game/braille";
import { Letter } from "./Letter";

type ChoicesProps = {
  choices: string[];
  language: Language;
  answer: string;
  /** The letter the player picked, once they have answered. */
  chosen?: string;
  labelledBy: string;
  onChoose: (letter: string) => void;
};

export const Choices = ({
  choices,
  language,
  answer,
  chosen,
  labelledBy,
  onChoose,
}: ChoicesProps) => {
  const answered = chosen !== undefined;
  return (
    <div className="choices" role="group" aria-labelledby={labelledBy}>
      {choices.map((letter) => {
        const mark = !answered
          ? undefined
          : letter === answer
            ? "right"
            : letter === chosen
              ? "wrong"
              : undefined;
        return (
          <button
            key={letter}
            type="button"
            className="choice"
            data-mark={mark}
            disabled={answered}
            onClick={() => onChoose(letter)}
          >
            <Letter letter={letter} language={language} />
            {/* The result is announced in words, the marks are for sight. */}
            {mark && (
              <span className="choice-mark" aria-hidden="true">
                {mark === "right" ? "✓" : "✗"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
