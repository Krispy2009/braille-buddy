import React from "react";
import type { Language } from "../../game/braille";
import { DotEntry, DOT_ENTRIES, Settings as SettingsType } from "../../game/settings";
import { BackIcon } from "../Icons/Icons";
import { LanguagePicker } from "../Practice/LanguagePicker";
import { ThemeSwitcher } from "../ThemeSwitcher/ThemeSwitcher";
import "./Settings.css";

const KeysPicture = () => (
  <span className="entry-picture keys-picture" aria-hidden="true">
    <span /><span /><span /><i /><span /><span /><span />
  </span>
);

const CellPicture = () => (
  <span className="entry-picture cell-picture" aria-hidden="true">
    <span /><span /><span /><span /><span /><span />
  </span>
);

const DOT_ENTRY_OPTIONS: Record<
  DotEntry,
  { name: string; hint: string; picture: React.ReactNode }
> = {
  keys: {
    name: "Brailler keys",
    hint: "Six keys, like a real braille typewriter",
    picture: <KeysPicture />,
  },
  cell: {
    name: "Tap the cell",
    hint: "Tap each dot of one big cell",
    picture: <CellPicture />,
  },
};

type ComfortSetting = "keyLetters" | "lessMotion" | "biggerText";

const COMFORT: { key: ComfortSetting; name: string }[] = [
  { key: "keyLetters", name: "Show key letters on keys" },
  { key: "lessMotion", name: "Less motion" },
  { key: "biggerText", name: "Bigger text" },
];

export type SettingsFocus = "course";

type SettingsProps = {
  settings: SettingsType;
  onChange: (next: SettingsType) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  /** Where focus goes when the screen opens, such as from "Change course". */
  focus?: SettingsFocus;
  /** Back to the screen Settings was opened from. */
  onBack: () => void;
};

/**
 * Its own screen, reached from the gear on Home (and "Change course"), never
 * shown inside a lesson. Every setting takes effect and is saved as soon as
 * it changes, so there is no Save button. Radios and switches announce their
 * own new state; nothing else is said.
 */
export const Settings = ({
  settings,
  onChange,
  language,
  onLanguageChange,
  focus,
  onBack,
}: SettingsProps) => {
  const id = React.useId();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const courseRef = React.useRef<HTMLFieldSetElement>(null);

  React.useEffect(() => {
    if (focus === "course") {
      // The chosen radio, so a screen reader says "Course, grouping, English,
      // radio button, checked" and the arrow keys work straight away.
      courseRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [focus]);

  return (
    <div className="screen settings">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h2 ref={headingRef} tabIndex={-1} className="frame-title">
          Settings
        </h2>
      </header>

      <fieldset className="setting">
        <legend className="setting-legend">Entering dots</legend>
        {DOT_ENTRIES.map((option) => {
          const { name, hint, picture } = DOT_ENTRY_OPTIONS[option];
          return (
            // The whole card is the target; the hint is a description, so
            // the radio's name stays short.
            <label key={option} className="option-card">
              <input
                type="radio"
                name="dot-entry"
                value={option}
                checked={settings.dotEntry === option}
                aria-labelledby={`${id}-${option}-name`}
                aria-describedby={`${id}-${option}-hint`}
                onChange={() => onChange({ ...settings, dotEntry: option })}
              />
              <span className="option-text">
                <span id={`${id}-${option}-name`} className="option-name">
                  {name}
                </span>
                <span id={`${id}-${option}-hint`} className="option-hint">
                  {hint}
                </span>
              </span>
              {picture}
            </label>
          );
        })}
        <p className="eyebrow">Keyboard keys F D S J K L always work.</p>
      </fieldset>

      <ThemeSwitcher />

      <fieldset className="setting comfort">
        <legend className="setting-legend">Comfort</legend>
        {COMFORT.map(({ key, name }) => (
          <label key={key} className="switch-row">
            <span>{name}</span>
            <input
              type="checkbox"
              role="switch"
              checked={settings[key]}
              onChange={(event) =>
                onChange({ ...settings, [key]: event.currentTarget.checked })
              }
            />
          </label>
        ))}
      </fieldset>

      <LanguagePicker ref={courseRef} language={language} onChange={onLanguageChange} />
    </div>
  );
};
