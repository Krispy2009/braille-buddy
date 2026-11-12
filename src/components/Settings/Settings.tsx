import React from "react";
import type { Language } from "../../game/braille";
import { DotEntry, DOT_ENTRIES, Settings as SettingsType } from "../../game/settings";
import { LanguagePicker } from "../Practice/LanguagePicker";

const DOT_ENTRY_OPTIONS: Record<DotEntry, { name: string; hint: string }> = {
  keys: {
    name: "Brailler keys",
    hint: "Six keys laid out like a Perkins brailler. Press one at a time or several together.",
  },
  cell: {
    name: "Tap the cell",
    hint: "One big braille cell. Tap its dots one at a time.",
  },
};

export type SettingsFocus = "course";

type SettingsProps = {
  settings: SettingsType;
  onChange: (next: SettingsType) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  /** Where focus goes when the screen opens, such as from "Change course". */
  focus?: SettingsFocus;
};

/**
 * Every setting takes effect and is saved as soon as it changes, so there is
 * no Save button. Radios announce their own new state; nothing else is said.
 * Kept free of where it is opened from, so the entry point can move.
 */
export const Settings = ({
  settings,
  onChange,
  language,
  onLanguageChange,
  focus,
}: SettingsProps) => {
  const id = React.useId();
  const courseRef = React.useRef<HTMLFieldSetElement>(null);

  React.useEffect(() => {
    if (focus !== "course") return;
    // The chosen radio, so a screen reader says "Course, grouping, English,
    // radio button, checked" and the arrow keys work straight away.
    courseRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
  }, [focus]);

  return (
    <div className="settings">
      <h2 className="settings-heading">Settings</h2>

      <fieldset className="setting">
        <legend className="setting-legend">Entering dots</legend>
        {DOT_ENTRIES.map((option) => {
          const { name, hint } = DOT_ENTRY_OPTIONS[option];
          return (
            // The whole row is the target; the hint is a description, so
            // the radio's name stays short.
            <label key={option} className="setting-option">
              <input
                type="radio"
                name="dot-entry"
                value={option}
                checked={settings.dotEntry === option}
                aria-labelledby={`${id}-${option}-name`}
                aria-describedby={`${id}-${option}-hint`}
                onChange={() => onChange({ ...settings, dotEntry: option })}
              />
              <span className="setting-text">
                <span id={`${id}-${option}-name`} className="setting-name">
                  {name}
                </span>
                <span id={`${id}-${option}-hint`} className="setting-hint">
                  {hint}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <LanguagePicker
        ref={courseRef}
        language={language}
        onChange={onLanguageChange}
      />
    </div>
  );
};
