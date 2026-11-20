import React from "react";
import { accountConfig, isAuthCallback } from "./account/config";
import { useAccount } from "./account/useAccount";
import { Account } from "./components/Account/Account";
import { Accessibility } from "./components/Accessibility/Accessibility";
import { Cards } from "./components/Cards/Cards";
import { Board } from "./components/Board/Board";
import { Daily } from "./components/Daily/Daily";
import { Home, HomeFocus } from "./components/Home/Home";
import { loadLanguage, saveLanguage } from "./components/Practice/LanguagePicker";
import { CHANGE_COURSE } from "./components/Practice/LessonList";
import { Practice, PracticeView } from "./components/Practice/Practice";
import { Privacy } from "./components/Privacy/Privacy";
import { Settings, SettingsFocus } from "./components/Settings/Settings";
import { getCourse } from "./courses";
import { dailyStatus } from "./daily/storage";
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
  | { screen: "daily" }
  | { screen: "cards"; letter?: string }
  | { screen: "practice"; start: PracticeView }
  | { screen: "settings"; focus?: SettingsFocus; back: View }
  | { screen: "accessibility"; back: View }
  | { screen: "account"; back: View }
  | { screen: "privacy"; back: View };

const now = () => new Date();

/** Opened from a sign-in email: show the Account screen, to say how it went. */
const firstView = (): View =>
  accountConfig() && isAuthCallback(window.location)
    ? { screen: "account", back: { screen: "home", focus: "account" } }
    : { screen: "home" };

function App() {
  const [view, setView] = React.useState<View>(firstView);
  // Kept here, above every screen, so a change shows everywhere at once.
  const [settings, setSettings] = React.useState(loadSettings);
  const [language, setLanguage] = React.useState<Language>(loadLanguage);
  const [progress, setProgress] = React.useState<Progress>(() => loadProgress());
  // Sync saved merged progress (and maybe the daily puzzle): read it again.
  const reload = React.useCallback(() => setProgress(loadProgress()), []);
  const account = useAccount(reload);
  const accounts = account.state.phase !== "off";

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
          daily={dailyStatus(course.id, now())}
          onDaily={() => setView({ screen: "daily" })}
          onStart={(lessonId) =>
            setView({
              screen: "practice",
              start: lessonId ? { screen: "lesson", lessonId } : { screen: "everything" },
            })
          }
          onLessons={() => setView({ screen: "practice", start: { screen: "lessons" } })}
          onExplore={() => setView({ screen: "explore" })}
          onCards={(letter) => setView({ screen: "cards", letter })}
          onSettings={() => setView({ screen: "settings", back: { screen: "home", focus: "settings" } })}
          account={
            accounts ? (account.state.phase === "signedIn" ? "signedIn" : "signedOut") : undefined
          }
          onAccount={() => setView({ screen: "account", back: { screen: "home", focus: "account" } })}
        />
      );
      break;
    case "explore":
      screen = (
        <Board
          dotEntry={settings.dotEntry}
          showKeyLetters={settings.keyLetters}
          keyShortcuts={settings.keyShortcuts}
          onHome={() => home("explore")}
        />
      );
      break;
    case "cards":
      screen = (
        <Cards
          course={course}
          letter={view.letter}
          onLanguageChange={changeLanguage}
          onHome={() => home("cards")}
        />
      );
      break;
    case "daily":
      screen = (
        <Daily
          course={course}
          dotEntry={settings.dotEntry}
          showKeyLetters={settings.keyLetters}
          keyShortcuts={settings.keyShortcuts}
          progress={progress}
          onProgress={changeProgress}
          onBack={() => home("daily")}
          now={now}
        />
      );
      break;
    case "practice":
      screen = (
        <Practice
          language={language}
          dotEntry={settings.dotEntry}
          showKeyLetters={settings.keyLetters}
          keyShortcuts={settings.keyShortcuts}
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
          onAccessibility={() => setView({ screen: "accessibility", back: view })}
          onPrivacy={() => setView({ screen: "privacy", back: view })}
          onAccount={accounts ? () => setView({ screen: "account", back: view }) : undefined}
          onBack={() => setView(view.back)}
        />
      );
      break;
    case "accessibility":
      screen = <Accessibility onBack={() => setView(view.back)} />;
      break;
    case "account":
      screen = (
        <Account
          state={account.state}
          actions={account.actions}
          onPrivacy={() => setView({ screen: "privacy", back: view })}
          onBack={() => setView(view.back)}
        />
      );
      break;
    case "privacy":
      screen = <Privacy accounts={accounts} onBack={() => setView(view.back)} />;
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
            <button
              type="button"
              className="quiet-button"
              onClick={() => setView({ screen: "accessibility", back: view })}
            >
              Accessibility
            </button>
            <button
              type="button"
              className="quiet-button"
              onClick={() => setView({ screen: "privacy", back: view })}
            >
              Privacy
            </button>
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
