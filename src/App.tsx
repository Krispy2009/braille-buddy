import React from "react";
import "./App.css";
import { Board } from "./components/Board/Board";
import {
  Mode,
  ModeTabs,
  MODES,
  panelId,
  tabId,
} from "./components/ModeTabs/ModeTabs";
import { loadLanguage, saveLanguage } from "./components/Practice/LanguagePicker";
import { Practice } from "./components/Practice/Practice";
import { Settings, SettingsFocus } from "./components/Settings/Settings";
import { ThemeSwitcher } from "./components/ThemeSwitcher/ThemeSwitcher";
import type { Language } from "./game/braille";
import {
  loadSettings,
  saveSettings,
  Settings as SettingsType,
} from "./game/settings";

const INTROS: Record<Mode, string> = {
  explore: "Raise dots to see which letter they make.",
  practice: "Learn the letters one lesson at a time, earn points and keep a daily streak.",
  settings: "Choose how you enter dots and which course you learn.",
};

function App() {
  const [mode, setMode] = React.useState<Mode>("explore");
  // Kept here, above all three screens, so a change shows everywhere at once.
  const [settings, setSettings] = React.useState(loadSettings);
  const [language, setLanguage] = React.useState<Language>(loadLanguage);
  const [settingsFocus, setSettingsFocus] = React.useState<SettingsFocus>();

  const changeSettings = (next: SettingsType) => {
    setSettings(next);
    saveSettings(next);
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    saveLanguage(next);
  };

  const changeMode = (next: Mode) => {
    setSettingsFocus(undefined);
    setMode(next);
  };

  const panels: Record<Mode, React.ReactNode> = {
    explore: <Board dotEntry={settings.dotEntry} />,
    practice: (
      <Practice
        language={language}
        dotEntry={settings.dotEntry}
        onChangeCourse={() => {
          setSettingsFocus("course");
          setMode("settings");
        }}
      />
    ),
    settings: (
      <Settings
        settings={settings}
        onChange={changeSettings}
        language={language}
        onLanguageChange={changeLanguage}
        focus={settingsFocus}
      />
    ),
  };

  return (
    <>
      <main className="App">
        <ThemeSwitcher />
        <h1>Braille Buddy</h1>
        <ModeTabs mode={mode} onChange={changeMode} />
        {MODES.map((option) => (
          // Only the open panel is rendered, so there is only ever one set
          // of key listeners and one live region on the page.
          <div
            key={option}
            id={panelId(option)}
            role="tabpanel"
            aria-labelledby={tabId(option)}
            hidden={mode !== option}
            // The panel starts with text, so it takes focus itself (as in
            // the APG tabs example) and Tab from the tabs lands on it.
            tabIndex={0}
            className="mode-panel"
          >
            {mode === option && (
              <>
                <p className="intro">{INTROS[option]}</p>
                {panels[option]}
              </>
            )}
          </div>
        ))}
      </main>
      <footer className="site-footer">
        <p className="about">
          Braille Buddy teaches the dot patterns. Reading braille by touch takes
          practice on real embossed braille.
        </p>
        made with <span aria-hidden="true">❤️</span>
        <span className="sr-only">love</span> by{" "}
        <a href="https://kristi.cy">kristi.cy</a>
      </footer>
    </>
  );
}

export default App;
