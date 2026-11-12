import React from "react";
import { Board } from "./components/Board/Board";
import { Home, HomeFocus } from "./components/Home/Home";
import { loadLanguage, saveLanguage } from "./components/Practice/LanguagePicker";
import { CHANGE_COURSE } from "./components/Practice/LessonList";
import { Practice, PracticeView } from "./components/Practice/Practice";
import { Settings, SettingsFocus } from "./components/Settings/Settings";
import { getCourse } from "./courses";
import type { Language } from "./game/braille";
import { loadProgress, Progress, saveProgress } from "./game/progress";
import {
  loadSettings,
  saveSettings,
  Settings as SettingsType,
} from "./game/settings";

/**
 * Which screen is open. Plain state, no router: Home is the hub, and every
 * other screen has one way back to where it was opened from.
 */
type View =
  | { screen: "home"; focus?: HomeFocus }
  | { screen: "explore" }
  | { screen: "practice"; start: PracticeView }
  | { screen: "settings"; focus?: SettingsFocus; back: View };

const now = () => new Date();

function App() {
  const [view, setView] = React.useState<View>({ screen: "home" });
  // Kept here, above every screen, so a change shows everywhere at once.
  const [settings, setSettings] = React.useState(loadSettings);
  const [language, setLanguage] = React.useState<Language>(loadLanguage);
  const [progress, setProgress] = React.useState<Progress>(() => loadProgress());

  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = settings.lessMotion ? "less" : "full";
    root.dataset.text = settings.biggerText ? "bigger" : "normal";
  }, [settings.lessMotion, settings.biggerText]);

  // A new screen starts at the top, as a new page would.
  React.useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [view.screen]);

  const changeSettings = (next: SettingsType) => {
    setSettings(next);
    saveSettings(next);
  };

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    saveLanguage(next);
  };

  const changeProgress = (next: Progress) => {
    setProgress(next);
    saveProgress(next);
  };

  const course = getCourse(language);
  const home = (focus: HomeFocus) => setView({ screen: "home", focus });

  let screen: React.ReactNode;
  switch (view.screen) {
    case "home":
      screen = (
        <Home
          course={course}
          progress={progress}
          now={now}
          focus={view.focus}
          onStart={(lessonId) =>
            setView({
              screen: "practice",
              start: lessonId ? { screen: "lesson", lessonId } : { screen: "everything" },
            })
          }
          onLessons={() => setView({ screen: "practice", start: { screen: "lessons" } })}
          onExplore={() => setView({ screen: "explore" })}
          onSettings={() => setView({ screen: "settings", back: { screen: "home", focus: "settings" } })}
        />
      );
      break;
    case "explore":
      screen = (
        <Board
          dotEntry={settings.dotEntry}
          showKeyLetters={settings.keyLetters}
          onHome={() => home("explore")}
        />
      );
      break;
    case "practice":
      screen = (
        <Practice
          language={language}
          dotEntry={settings.dotEntry}
          showKeyLetters={settings.keyLetters}
          progress={progress}
          onProgress={changeProgress}
          start={view.start}
          onHome={() => home("lessons")}
          onChangeCourse={() =>
            setView({
              screen: "settings",
              focus: "course",
              back: { screen: "practice", start: { screen: "lessons", returnTo: CHANGE_COURSE } },
            })
          }
        />
      );
      break;
    case "settings":
      screen = (
        <Settings
          settings={settings}
          onChange={changeSettings}
          language={language}
          onLanguageChange={changeLanguage}
          focus={view.focus}
          onBack={() => setView(view.back)}
        />
      );
      break;
  }

  const onHome = view.screen === "home";
  return (
    <>
      <main>
        {/* Home shows the name as its wordmark; elsewhere it is still the
            page's first heading for screen reader users. */}
        {!onHome && <h1 className="sr-only">Braille Buddy</h1>}
        {screen}
      </main>
      {onHome && (
        <footer className="site-footer">
          <p className="about">
            Braille Buddy teaches the dot patterns. Reading braille by touch
            takes practice on real embossed braille.
          </p>
          made with <span aria-hidden="true">❤️</span>
          <span className="sr-only">love</span> by{" "}
          <a href="https://kristi.cy">kristi.cy</a>
        </footer>
      )}
    </>
  );
}

export default App;
