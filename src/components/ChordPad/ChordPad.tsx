import React from "react";
import styled from "styled-components";
import { CHORD_KEYS } from "../../hooks/useBrailleKeys";

type ChordPadProps = {
  /** Pass the same ref to useBrailleKeys as `chordArea`. */
  ref?: React.Ref<HTMLDivElement>;
  /** Mention Enter in the instructions (practice mode). */
  canSubmit?: boolean;
  /** Ids of text read before the instructions, such as the question. */
  describedBy?: string;
};

const Pad = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  max-width: 22rem;
  padding: 0.9rem 1rem;
  border: 2px dashed var(--line);
  border-radius: 0.75rem;
  background: var(--tile);
  color: var(--ink);
  cursor: pointer;

  &[data-active="true"] {
    border-style: solid;
    border-color: var(--focus);
    cursor: default;
  }

  &:focus-visible,
  &:focus {
    outline: 3px solid var(--focus);
    outline-offset: 3px;
  }

  @media (forced-colors: active) {
    border-color: ButtonText;

    &[data-active="true"] {
      border-color: Highlight;
    }
  }
`;

const Keys = styled.span`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;

  & > span:nth-child(3) {
    margin-right: 1rem;
  }
`;

const KeyCap = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.8rem;
`;

// Keyboard order, so dot 1 sits under the left index finger as on a Perkins.
const KEYS = ["KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"].map((code) => ({
  label: code.slice(3),
  dot: CHORD_KEYS[code].slice(3),
}));

// Phones and tablets without a mouse or trackpad. A blind player may still
// pair a Bluetooth keyboard, which no media query reveals, so the pad is
// collapsed there rather than removed.
const isTouchOnly = (): boolean =>
  !!window.matchMedia?.("(pointer: coarse)").matches &&
  !window.matchMedia("(any-pointer: fine)").matches;

/**
 * A focus target for chord entry. role="application" makes NVDA and JAWS
 * switch to focus mode on their own when it is focused, so the letter keys
 * reach the page instead of being taken as quick navigation keys. It holds
 * no content to read, and Tab leaves it as usual, so nothing is trapped.
 */
export const ChordPad = ({
  ref,
  canSubmit = false,
  describedBy,
}: ChordPadProps) => {
  const helpId = React.useId();
  const [active, setActive] = React.useState(false);
  const [collapsible] = React.useState(isTouchOnly);
  const [open, setOpen] = React.useState(false);

  const pad = (
    <div className="chord-pad">
      <Pad
        ref={ref}
        tabIndex={0}
        role="application"
        aria-label="Braille keyboard"
        aria-describedby={describedBy ? `${describedBy} ${helpId}` : helpId}
        data-active={active}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      >
        <span aria-hidden="true">
          {active
            ? "Chord typing is on"
            : "Select here or Tab here to type chords"}
        </span>
        <Keys aria-hidden="true">
          {KEYS.map(({ label, dot }) => (
            <KeyCap key={label}>
              <kbd>{label}</kbd>
              {dot}
            </KeyCap>
          ))}
        </Keys>
      </Pad>
      {/* Outside the application so browse mode can read it too. Escape is
          left out on purpose: NVDA takes it to leave focus mode. */}
      <p id={helpId} className="help">
        Hold <kbd>F</kbd> <kbd>D</kbd> <kbd>S</kbd> for dots 1 2 3 and{" "}
        <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> for dots 4 5 6 together, like a
        Perkins brailler, then let go to write the letter. Keys{" "}
        <kbd>1</kbd> to <kbd>6</kbd> raise or lower one dot.{" "}
        <kbd>Backspace</kbd> clears the cell.
        {canSubmit && (
          <>
            {" "}
            <kbd>Enter</kbd> checks your answer.
          </>
        )}{" "}
        Press <kbd>Tab</kbd> to leave.
      </p>
    </div>
  );

  if (!collapsible) {
    return pad;
  }
  return (
    <details
      className="chord-pad-disclosure"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Typing on a keyboard?</summary>
      {pad}
    </details>
  );
};
