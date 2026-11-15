import { spellWord } from "../../daily/daily";
import { Language, LANGUAGE_TAGS } from "../../game/braille";

/**
 * A word in print, marked with its language, then spelled for screen readers
 * ("cat, spelled c, a, t"): letter by letter is how it is written in braille,
 * and Greek is read by letter names where there is no Greek voice.
 */
export const Word = ({ word, language }: { word: string; language: Language }) => (
  <>
    <span className="letter-chip daily-word" lang={LANGUAGE_TAGS[language]}>
      {word}
    </span>
    <span className="sr-only">, spelled {spellWord(word, language)}</span>
  </>
);
