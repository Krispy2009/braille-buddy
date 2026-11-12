import React from "react";
import { CellType, CLEAR_CELL, DotKey } from "../../game/braille";
import { CHORD_KEYS } from "../../hooks/useBrailleKeys";
import { isTouchOnly } from "../ChordPad/ChordPad";
import "./BraillerKeys.css";

type BraillerKeysProps = {
  /** Pass the same ref to useBrailleKeys as `chordArea`. */
  ref?: React.Ref<HTMLDivElement>;
  positions: CellType;
  /** One key selected: a tap, a click, Space or Enter on a key. */
  onToggleDot: (dot: DotKey) => void;
  /** Several keys pressed together on a touch screen, then let go. */
  onChord: (cell: CellType) => void;
  /** Ids of text read when the keys take focus: the question, then the help. */
  describedBy?: string;
  /** Print the keyboard letter under each number (a Comfort setting). The
      letter stays in the key's name either way. */
  showLetters?: boolean;
};

const KEY_FOR_DOT = Object.fromEntries(
  Object.entries(CHORD_KEYS).map(([code, dot]) => [dot, code.slice(3)])
) as Record<DotKey, string>;

// Perkins order: the left hand's index finger is dot 1, so it reads 3 2 1.
const HANDS: DotKey[][] = [
  ["dot3", "dot2", "dot1"],
  ["dot4", "dot5", "dot6"],
];

// A chord's own clicks, if the browser sends any, come straight after its
// last finger lifts. Later clicks are new taps.
const SWALLOW_MS = 1000;

/**
 * Six on-screen keys laid out like a Perkins brailler, and the chord typing
 * area for the physical keyboard in one widget.
 *
 * role="application" does for the keys what it does for ChordPad: NVDA and
 * JAWS switch to focus mode inside it, so F D S J K L reach the page instead
 * of being quick navigation keys. The container itself is the first Tab stop
 * and where focus returns for chord typists, so Enter there checks the
 * answer; Tab moves on into the keys, which are ordinary toggle buttons.
 *
 * Tap or chord: every key toggles on click, which is also what Space, Enter
 * and a screen reader's double tap send, so a single activation always
 * toggles exactly once. Touches that overlap (a second finger lands before
 * the first lifts) are a chord instead: when the last one lifts, the cell
 * becomes exactly those dots, as a physical chord does, and the clicks for
 * those keys are dropped. VoiceOver and TalkBack keep multi-finger gestures
 * for themselves, so for their users the keys are only ever single taps.
 */
export const BraillerKeys = ({
  ref,
  positions,
  onToggleDot,
  onChord,
  describedBy,
  showLetters = true,
}: BraillerKeysProps) => {
  const touches = React.useRef(new Map<number, DotKey>());
  const chord = React.useRef({ dots: new Set<DotKey>(), multi: false, aborted: false });
  const swallow = React.useRef<{ dots: Set<DotKey>; until: number } | null>(null);

  const onPointerDown = (dot: DotKey) => (event: React.PointerEvent) => {
    // A mouse has one pointer and can't chord; touch and pen pointers are
    // captured by the key they start on, so their up or cancel always
    // arrives here and none get stuck.
    if (event.pointerType === "mouse") return;
    if (event.isPrimary || touches.current.size === 0) {
      touches.current.clear();
      chord.current = { dots: new Set(), multi: false, aborted: false };
      swallow.current = null;
    }
    touches.current.set(event.pointerId, dot);
    chord.current.dots.add(dot);
    if (touches.current.size > 1) chord.current.multi = true;
  };

  const release = (cancelled: boolean) => (event: React.PointerEvent) => {
    if (!touches.current.delete(event.pointerId)) return;
    if (cancelled) chord.current.aborted = true;
    if (touches.current.size > 0 || !chord.current.multi) return;
    const { dots, aborted } = chord.current;
    swallow.current = { dots: new Set(dots), until: event.timeStamp + SWALLOW_MS };
    if (!aborted) {
      const cell = { ...CLEAR_CELL };
      dots.forEach((held) => (cell[held] = true));
      onChord(cell);
    }
  };

  const onClick = (dot: DotKey) => (event: React.MouseEvent) => {
    const pending = swallow.current;
    if (pending?.dots.has(dot) && event.timeStamp < pending.until) {
      pending.dots.delete(dot);
      return;
    }
    onToggleDot(dot);
  };

  return (
    <div
      ref={ref}
      className={showLetters ? "brailler-keys" : "brailler-keys no-letters"}
      role="application"
      aria-label="Brailler keys"
      aria-describedby={describedBy}
      tabIndex={0}
    >
      {HANDS.map((hand, index) => (
        <div key={index} className="brailler-hand">
          {hand.map((dot) => {
            const number = dot.slice(3);
            const letter = KEY_FOR_DOT[dot];
            return (
              <button
                key={dot}
                type="button"
                className="brailler-key"
                aria-pressed={positions[dot]}
                aria-label={`Dot ${number}, key ${letter}`}
                onClick={onClick(dot)}
                onPointerDown={onPointerDown(dot)}
                onPointerUp={release(false)}
                onPointerCancel={release(true)}
              >
                <span className="brailler-key-dot">{number}</span>
                <span className="brailler-key-letter">{letter}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

type BraillerKeysHelpProps = {
  /** The keyboard instructions' id, for the keys' aria-describedby. */
  id: string;
  /** Mention Enter (practice mode). */
  canSubmit?: boolean;
};

/**
 * Outside the application so browse mode can read it too. Backspace, not
 * Escape: NVDA takes Escape to leave focus mode. On touch-only devices the
 * keyboard part folds away, as ChordPad does, but stays in reach for a
 * paired Bluetooth keyboard.
 */
export const BraillerKeysHelp = ({ id, canSubmit = false }: BraillerKeysHelpProps) => {
  const [collapsible] = React.useState(isTouchOnly);
  const keyboard = (
    <p id={id} className="help">
      On a keyboard, while the brailler keys have focus, hold <kbd>F</kbd>{" "}
      <kbd>D</kbd> <kbd>S</kbd> for dots 1 2 3 and <kbd>J</kbd> <kbd>K</kbd>{" "}
      <kbd>L</kbd> for dots 4 5 6 together, then let go to write the letter.
      Keys <kbd>1</kbd> to <kbd>6</kbd> raise or lower one dot.{" "}
      <kbd>Backspace</kbd> clears the cell.
      {canSubmit && (
        <>
          {" "}
          <kbd>Enter</kbd> checks your answer, except on a single key, where
          it raises or lowers that dot like <kbd>Space</kbd>.
        </>
      )}
    </p>
  );
  return (
    <div className="brailler-help">
      <p className="help">
        Select a key to raise or lower its dot. On a touch screen you can also
        press several keys at once and let go to write a whole letter.
      </p>
      {collapsible ? (
        <details className="chord-pad-disclosure">
          <summary>Typing on a keyboard?</summary>
          {keyboard}
        </details>
      ) : (
        keyboard
      )}
    </div>
  );
};
