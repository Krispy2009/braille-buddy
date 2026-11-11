import React from "react";
import { CellType, CLEAR_CELL, DotKey } from "../game/braille";

export type BrailleKeysOptions = {
  /** Toggle one dot (number keys 1-6). */
  onToggleDot: (dot: DotKey) => void;
  /** A chord was completed: the full set of dots pressed together. Replaces the cell contents. */
  onChord: (cell: CellType) => void;
  /** Escape or Backspace. */
  onClear: () => void;
  /** Enter. Optional (practice mode uses it to submit an answer). */
  onSubmit?: () => void;
  /** When false, no listeners are attached. Default true. */
  enabled?: boolean;
  /**
   * When set, chord keys only work while focus is inside this element (the
   * ChordPad). Single letter shortcuts that work anywhere fail WCAG 2.1.4 and
   * fire when speech input users dictate, so the UI should pass this. When
   * omitted, chord keys work anywhere outside text fields.
   */
  chordArea?: React.RefObject<HTMLElement | null>;
};

/**
 * Exported for the help text and tests: f d s = dots 1 2 3, j k l = dots 4 5 6.
 *
 * Keyed by `event.code`, the physical key, so the chords work with a Greek
 * (or any other) layout active. On AZERTY and QWERTZ these physical keys carry
 * the same letters; on Dvorak or Colemak they carry other letters, but braille
 * entry is about finger positions on the home row, so the physical keys are
 * still the right ones. Only the help text's labels would be off there.
 */
export const CHORD_KEYS: Readonly<Record<string, DotKey>> = Object.freeze({
  KeyF: "dot1",
  KeyD: "dot2",
  KeyS: "dot3",
  KeyJ: "dot4",
  KeyK: "dot5",
  KeyL: "dot6",
});

const NON_TEXT_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** Fields where keys are typing, not braille input. */
const isTextEntry = (element: Element): boolean => {
  if (element instanceof HTMLInputElement) {
    return !NON_TEXT_INPUTS.has(element.type);
  }
  return (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    (element instanceof HTMLElement && element.isContentEditable) ||
    element.closest('[contenteditable=""], [contenteditable="true"]') !== null
  );
};

/** Elements that Enter already activates. */
const ACTIVATES_ON_ENTER =
  'button, a[href], summary, input, [role="button"], [role="link"], ' +
  '[role="checkbox"], [role="radio"], [role="switch"], [role="tab"], ' +
  '[role="menuitem"], [role="option"]';

const hasModifier = (event: KeyboardEvent): boolean =>
  event.ctrlKey || event.metaKey || event.altKey;

const targetElement = (event: KeyboardEvent): Element | null =>
  event.target instanceof Element ? event.target : null;

export const useBrailleKeys = ({
  onToggleDot,
  onChord,
  onClear,
  onSubmit,
  enabled = true,
  chordArea,
}: BrailleKeysOptions): void => {
  // Effect events always see the latest callbacks without being effect
  // dependencies, so new callback identities never re-attach the listeners.
  const toggleDot = React.useEffectEvent((dot: DotKey) => onToggleDot(dot));
  const chord = React.useEffectEvent((cell: CellType) => onChord(cell));
  const clear = React.useEffectEvent(() => onClear());
  const submit = React.useEffectEvent(() => onSubmit?.());

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    // Keys currently held, and every dot held at any point in this chord.
    const held = new Set<string>();
    let dots = new Set<DotKey>();
    let aborted = false;

    const resetChord = () => {
      held.clear();
      dots = new Set();
      aborted = false;
    };

    const inChordArea = (target: Element | null): boolean => {
      if (chordArea === undefined) {
        return true;
      }
      const area = chordArea.current;
      return !!area && !!target && area.contains(target);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = targetElement(event);
      if (event.isComposing || (target && isTextEntry(target))) {
        return;
      }
      if (hasModifier(event)) {
        // Ctrl+F mid-chord, for example: the chord was not meant as braille.
        if (held.size > 0) {
          aborted = true;
        }
        return;
      }
      if (event.repeat) {
        return;
      }

      const dot = CHORD_KEYS[event.code];
      if (dot && inChordArea(target)) {
        // Stops Firefox's find-as-you-type and similar letter handling.
        event.preventDefault();
        held.add(event.code);
        dots.add(dot);
        return;
      }

      // Enter on keydown, not keyup: a button that moves focus on Enter would
      // otherwise hand the keyup to whatever it focused and submit as well.
      // preventDefault for the mirror case: when submitting moves focus to a
      // button (Next), the browser would activate that button with this
      // same Enter press.
      if (
        event.key === "Enter" &&
        !(target && target.closest(ACTIVATES_ON_ENTER))
      ) {
        event.preventDefault();
        submit();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const target = targetElement(event);

      // Always let go of a held key, even from a field or with a modifier,
      // so a chord can never get stuck. A keyup we never saw a keydown for
      // (ghosting, or a key held before focus arrived) is ignored.
      if (held.has(event.code)) {
        held.delete(event.code);
        if (
          hasModifier(event) ||
          !inChordArea(target) ||
          (target && isTextEntry(target))
        ) {
          aborted = true;
        }
        if (held.size === 0) {
          const cell = { ...CLEAR_CELL };
          dots.forEach((dot) => (cell[dot] = true));
          const commit = !aborted && dots.size > 0;
          resetChord();
          if (commit) {
            chord(cell);
          }
        }
        return;
      }

      if (
        event.isComposing ||
        hasModifier(event) ||
        (target && isTextEntry(target))
      ) {
        return;
      }
      if (/^[1-6]$/.test(event.key)) {
        toggleDot(`dot${event.key}` as DotKey);
      } else if (event.key === "Escape" || event.key === "Backspace") {
        resetChord();
        clear();
      }
    };

    // The keyups of a chord that was held while the window lost focus never
    // arrive, so drop the chord instead of committing it later.
    const onBlur = () => resetChord();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        resetChord();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, chordArea]);
};
