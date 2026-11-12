import type React from "react";
import { Language, LANGUAGE_LABELS, LANGUAGE_TAGS, LANGUAGES } from "../../game/braille";

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

/** "Ελληνικά" for Greek: each course in its own language, from the browser. */
const nativeName = (language: Language): string | undefined => {
  try {
    const tag = LANGUAGE_TAGS[language];
    const name = new Intl.DisplayNames([tag], { type: "language" }).of(tag);
    return name && name.charAt(0).toLocaleUpperCase(tag) + name.slice(1);
  } catch {
    return undefined;
  }
};

/**
 * One radio per course in src/courses, each shown in its own language. The
 * radio's name stays in English ("Greek"): a screen reader without a Greek
 * voice would spell "Ελληνικά" out as symbols.
 */
export const LanguagePicker = ({ language, onChange, ref }: LanguagePickerProps) => (
  <fieldset ref={ref} className="setting">
    <legend className="setting-legend">Course</legend>
    <div className="course-options">
      {LANGUAGES.map((option) => {
        const name = LANGUAGE_LABELS[option];
        const native = nativeName(option);
        return (
          <label key={option} className="course-option">
            <input
              type="radio"
              name="practice-language"
              value={option}
              checked={language === option}
              onChange={() => onChange(option)}
            />
            {native && native !== name ? (
              <>
                <span lang={LANGUAGE_TAGS[option]} aria-hidden="true">
                  {native}
                </span>
                <span className="sr-only">{name}</span>
              </>
            ) : (
              <span>{name}</span>
            )}
          </label>
        );
      })}
    </div>
  </fieldset>
);
