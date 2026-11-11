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
import { Practice } from "./components/Practice/Practice";
import { ThemeSwitcher } from "./components/ThemeSwitcher/ThemeSwitcher";

const INTROS: Record<Mode, string> = {
  explore: "Raise dots to see which letter they make.",
  practice: "Answer questions to earn points and keep a daily streak.",
};

function App() {
  const [mode, setMode] = React.useState<Mode>("explore");

  return (
    <>
      <main className="App">
        <ThemeSwitcher />
        <h1>Braille Buddy</h1>
        <ModeTabs mode={mode} onChange={setMode} />
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
                {option === "explore" ? <Board /> : <Practice />}
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
