import React from "react";

export const THEMES = ["light", "dark", "high-visibility"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "theme";

// The stored values stay light/dark/high-visibility so saved choices and
// the pre-paint script in index.html keep working; only the names changed.
const LABELS: Record<Theme, string> = {
  light: "Paper",
  dark: "Ink",
  "high-visibility": "High vis",
};

const isTheme = (value: unknown): value is Theme =>
  THEMES.includes(value as Theme);

// Mirrors the inline script in index.html, which applies the theme before
// React loads so the page doesn't flash the wrong colors.
export const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isTheme(saved)) {
      return saved;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  if (window.matchMedia?.("(prefers-contrast: more)").matches) {
    return "high-visibility";
  }
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export const ThemeSwitcher = () => {
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const choose = (next: Theme) => {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembering the choice is fine.
    }
  };

  // Each card previews its theme with that theme's own tokens: the
  // preview carries data-theme, which tokens.css matches on any element.
  return (
    <fieldset className="setting">
      <legend className="setting-legend">Theme</legend>
      <div className="theme-cards">
        {THEMES.map((option) => (
          <label key={option} className="theme-card">
            <span className="theme-preview" data-theme={option} aria-hidden="true">
              <span className="theme-preview-dot" />
              <span className="theme-preview-bar" />
            </span>
            <span className="theme-name">
              <input
                type="radio"
                name="theme"
                value={option}
                checked={theme === option}
                onChange={() => choose(option)}
              />
              {LABELS[option]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
