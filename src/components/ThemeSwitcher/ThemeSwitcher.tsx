import React from "react";

export const THEMES = ["light", "dark", "high-visibility"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "theme";

const LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  "high-visibility": "High visibility",
};

const ICONS: Record<Theme, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  "high-visibility": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </>
  ),
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

  return (
    <fieldset className="theme-switcher">
      <legend className="sr-only">Color theme</legend>
      {THEMES.map((option) => (
        <label key={option}>
          <input
            type="radio"
            name="theme"
            value={option}
            checked={theme === option}
            onChange={() => choose(option)}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            {ICONS[option]}
          </svg>
          {LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
};
