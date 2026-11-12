import React from "react";
import styled from "styled-components";
import { CHORD_KEYS } from "../../hooks/useBrailleKeys";

type ChordPadProps = {
  /** For moving focus back to the pad. */
  ref?: React.Ref<HTMLDivElement>;
  /** Mention Enter in the instructions (practice mode). */
  canSubmit?: boolean;
  /** Ids of text read before the instructions, such as the question. */
  describedBy?: string;
};

const Pad = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.25rem 0.6rem;
  min-height: 2.75rem;
  padding: 0.35rem 0.9rem;
  border: 2px dashed transparent;
  border-radius: 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--text-soft);
  cursor: pointer;

  &[data-active="true"] {
    border-color: var(--line);
    border-style: solid;
    color: var(--text);
    cursor: default;
  }

  &:focus-visible,
  &:focus {
    outline: 3px solid var(--focus);
    outline-offset: 2px;
  }

  @media (forced-colors: active) {
    border-color: ButtonText;
  }
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  /* The full instructions take room only while the pad has focus. */
  &:not(:focus-within) .chord-pad-help {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
`;

const Keys = styled.span`
  display: inline-flex;
  gap: 0.45rem;

  & > span:nth-child(3)::after {
    content: "·";
    margin-left: 0.45rem;
  }
`;

const KeyCap = styled.kbd`
  border: 0;
  padding: 0;
  font-size: 1em;
`;

// Read as the dots go: F D S are dots 1 2 3, J K L are dots 4 5 6.
const KEYS = Object.keys(CHORD_KEYS).map((code) => code.slice(3));

// Phones and tablets without a mouse or trackpad. A blind player may still
// pair a Bluetooth keyboard, which no media query reveals, so the pad is
// collapsed there rather than removed.
export const isTouchOnly = (): boolean =>
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
    <Wrap className="chord-pad">
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
          {active ? "Chord typing is on:" : "Keyboard works too:"}
        </span>
        <Keys aria-hidden="true">
          {KEYS.map((label) => (
            <span key={label}>
              <KeyCap>{label}</KeyCap>
            </span>
          ))}
        </Keys>
      </Pad>
      {/* Outside the application so browse mode can read it too, and shown
          on screen while the pad has focus. Escape is left out on purpose:
          NVDA takes it to leave focus mode. */}
      <p id={helpId} className="help chord-pad-help">
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
    </Wrap>
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
