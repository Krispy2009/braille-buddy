import type React from "react";
import { Language, LANGUAGE_LABELS, LANGUAGES } from "../../game/braille";

const STORAGE_KEY = "braille-buddy:practice-language";

export const loadLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(saved as Language)) {
      return saved as Language;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return LANGUAGES.includes("english") ? "english" : LANGUAGES[0];
};

export const saveLanguage = (language: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not remembering the choice is fine.
  }
};

type LanguagePickerProps = {
  language: Language;
  onChange: (language: Language) => void;
  /** On the fieldset, so Settings can move focus to the chosen course. */
  ref?: React.Ref<HTMLFieldSetElement>;
};

/** One radio per course in src/courses. Lives on the Settings screen. */
export const LanguagePicker = ({ language, onChange, ref }: LanguagePickerProps) => (
  <fieldset ref={ref} className="setting">
    <legend className="setting-legend">Course</legend>
    {LANGUAGES.map((option) => (
      <label key={option} className="setting-option">
        <input
          type="radio"
          name="practice-language"
          value={option}
          checked={language === option}
          onChange={() => onChange(option)}
        />
        <span className="setting-name">{LANGUAGE_LABELS[option]}</span>
      </label>
    ))}
  </fieldset>
);
