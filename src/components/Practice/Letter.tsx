import { Language, LANGUAGE_TAGS, spokenLetter } from "../../game/braille";

type LetterProps = {
  letter: string;
  language: Language;
  className?: string;
};

// Greek is read by its letter names, since screen readers without a Greek
// voice spell the characters as symbols. Same technique as Board's Result.
export const Letter = ({ letter, language, className }: LetterProps) => {
  const spoken = spokenLetter(letter, language);
  if (spoken === letter) {
    return (
      <span className={className} lang={LANGUAGE_TAGS[language]}>
        {letter}
      </span>
    );
  }
  return (
    <>
      <span className={className} lang={LANGUAGE_TAGS[language]} aria-hidden="true">
        {letter}
      </span>
      <span className="sr-only">{spoken}</span>
    </>
  );
};
