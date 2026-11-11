import React from "react";

export const MODES = ["explore", "practice"] as const;
export type Mode = (typeof MODES)[number];

const LABELS: Record<Mode, string> = {
  explore: "Explore",
  practice: "Practice",
};

export const tabId = (mode: Mode) => `mode-tab-${mode}`;
export const panelId = (mode: Mode) => `mode-panel-${mode}`;

type ModeTabsProps = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

/**
 * The ARIA tabs pattern: both modes swap a panel in place on one page, with
 * no URL change, which is exactly what tabs announce ("Practice, tab, 2 of
 * 2, selected"). Links with aria-current would promise navigation that
 * doesn't happen, and radio buttons describe a form value, not the content
 * below. Tabs activate on arrow keys because both panels render instantly.
 */
export const ModeTabs = ({ mode, onChange }: ModeTabsProps) => {
  const tabs = React.useRef<Partial<Record<Mode, HTMLButtonElement | null>>>(
    {}
  );

  const select = (next: Mode) => {
    onChange(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = MODES.indexOf(mode);
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: MODES.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(MODES[(moves[event.key] + MODES.length) % MODES.length]);
  };

  return (
    <div
      className="segmented mode-tabs"
      role="tablist"
      aria-label="Mode"
      onKeyDown={onKeyDown}
    >
      {MODES.map((option) => (
        <button
          key={option}
          ref={(element) => {
            tabs.current[option] = element;
          }}
          id={tabId(option)}
          type="button"
          role="tab"
          aria-selected={mode === option}
          aria-controls={panelId(option)}
          tabIndex={mode === option ? 0 : -1}
          onClick={() => onChange(option)}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
};
