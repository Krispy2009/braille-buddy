import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CellType, CLEAR_CELL, DotKey } from "../../game/braille";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { BraillerKeys, BraillerKeysHelp } from "./BraillerKeys";

const cellOf = (...dots: number[]): CellType => {
  const cell = { ...CLEAR_CELL };
  dots.forEach((dot) => (cell[`dot${dot}` as DotKey] = true));
  return cell;
};

type Handlers = {
  onToggleDot: (dot: DotKey) => void;
  onChord: (cell: CellType) => void;
  onSubmit: () => void;
};

// The keys as LessonPractice uses them: they hold the cell and are the
// chord area for the physical keyboard.
const Harness = ({ onToggleDot, onChord, onSubmit }: Handlers) => {
  const [positions, setPositions] = React.useState(CLEAR_CELL);
  const area = React.useRef<HTMLDivElement>(null);
  const toggle = (dot: DotKey) => {
    onToggleDot(dot);
    setPositions((current) => ({ ...current, [dot]: !current[dot] }));
  };
  const chord = (cell: CellType) => {
    onChord(cell);
    setPositions(cell);
  };
  useBrailleKeys({
    onToggleDot: toggle,
    onChord: chord,
    onClear: () => setPositions(CLEAR_CELL),
    onSubmit,
    chordArea: area,
  });
  return (
    <>
      <button type="button">Before</button>
      <BraillerKeys
        ref={area}
        positions={positions}
        onToggleDot={toggle}
        onChord={chord}
        describedBy="help"
      />
      <BraillerKeysHelp id="help" canSubmit />
    </>
  );
};

const setup = () => {
  const handlers = { onToggleDot: vi.fn(), onChord: vi.fn(), onSubmit: vi.fn() };
  const user = userEvent.setup();
  render(<Harness {...handlers} />);
  const area = screen.getByRole("application", { name: "Brailler keys" });
  const key = (dot: number) =>
    within(area).getByRole("button", { name: new RegExp(`^Dot ${dot},`) });
  return { user, area, key, ...handlers };
};

const touch = (pointerId: number, isPrimary = false) => ({
  pointerId,
  pointerType: "touch",
  isPrimary,
});

test("six keys in Perkins order, 3 2 1 then 4 5 6, each named by dot and key", () => {
  const { area } = setup();
  expect(
    within(area)
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"))
  ).toEqual([
    "Dot 3, key S",
    "Dot 2, key D",
    "Dot 1, key F",
    "Dot 4, key J",
    "Dot 5, key K",
    "Dot 6, key L",
  ]);
  // The same order on screen: dot number with its keyboard letter under it.
  expect(
    within(area)
      .getAllByRole("button")
      .map((button) => button.textContent)
  ).toEqual(["3S", "2D", "1F", "4J", "5K", "6L"]);
});

test("is one application with a name and instructions, readable outside it", () => {
  const { area } = setup();
  expect(area).toHaveAttribute("tabindex", "0");
  expect(area).toHaveAccessibleDescription(
    /hold f d s for dots 1 2 3 and j k l for dots 4 5 6 together/i
  );
  expect(area).toHaveAccessibleDescription(/backspace clears the cell/i);
  // NVDA leaves focus mode on Escape, so the help never suggests it.
  expect(area).not.toHaveAccessibleDescription(/escape/i);
  expect(screen.getByText(/hold/i).closest('[role="application"]')).toBeNull();
});

test("keys are toggle buttons that show their pressed state", async () => {
  const { user, key, onToggleDot } = setup();
  expect(key(1)).toHaveAttribute("aria-pressed", "false");
  await user.click(key(1));
  expect(key(1)).toHaveAttribute("aria-pressed", "true");
  await user.click(key(1));
  expect(key(1)).toHaveAttribute("aria-pressed", "false");
  expect(onToggleDot.mock.calls).toEqual([["dot1"], ["dot1"]]);
});

test("Space and Enter on a focused key toggle it exactly once and never check", async () => {
  const { user, key, onToggleDot, onSubmit } = setup();
  key(4).focus();
  await user.keyboard(" ");
  expect(onToggleDot).toHaveBeenCalledTimes(1);
  expect(key(4)).toHaveAttribute("aria-pressed", "true");
  await user.keyboard("{Enter}");
  expect(onToggleDot).toHaveBeenCalledTimes(2);
  expect(key(4)).toHaveAttribute("aria-pressed", "false");
  expect(onSubmit).not.toHaveBeenCalled();
});

test("a screen reader's double tap arrives as a click and toggles once", () => {
  const { key, onToggleDot } = setup();
  fireEvent.click(key(2));
  expect(onToggleDot).toHaveBeenCalledTimes(1);
  expect(key(2)).toHaveAttribute("aria-pressed", "true");
});

test("a single touch tap toggles once and is not a chord", () => {
  const { key, onToggleDot, onChord } = setup();
  fireEvent.pointerDown(key(1), touch(1, true));
  fireEvent.pointerUp(key(1), touch(1, true));
  fireEvent.click(key(1));
  expect(onToggleDot).toHaveBeenCalledTimes(1);
  expect(onChord).not.toHaveBeenCalled();
  expect(key(1)).toHaveAttribute("aria-pressed", "true");
});

test("touches that overlap write exactly those dots when the last one lifts", async () => {
  const { user, key, onToggleDot, onChord } = setup();
  // Something raised already: a chord replaces the cell, like the keyboard.
  await user.click(key(6));
  onToggleDot.mockClear();

  fireEvent.pointerDown(key(1), touch(1, true));
  fireEvent.pointerDown(key(4), touch(2));
  fireEvent.pointerUp(key(1), touch(1, true));
  // Nothing happens until every finger is up.
  expect(onChord).not.toHaveBeenCalled();
  fireEvent.pointerDown(key(5), touch(3));
  fireEvent.pointerUp(key(4), touch(2));
  fireEvent.pointerUp(key(5), touch(3));
  // Some browsers still send a click per finger: those are dropped.
  fireEvent.click(key(1));
  fireEvent.click(key(4));
  fireEvent.click(key(5));

  expect(onChord).toHaveBeenCalledTimes(1);
  expect(onChord).toHaveBeenCalledWith(cellOf(1, 4, 5));
  expect(onToggleDot).not.toHaveBeenCalled();
  expect(key(1)).toHaveAttribute("aria-pressed", "true");
  expect(key(4)).toHaveAttribute("aria-pressed", "true");
  expect(key(5)).toHaveAttribute("aria-pressed", "true");
  expect(key(6)).toHaveAttribute("aria-pressed", "false");

  // The next tap is an ordinary toggle again.
  fireEvent.pointerDown(key(1), touch(4, true));
  fireEvent.pointerUp(key(1), touch(4, true));
  fireEvent.click(key(1));
  expect(onToggleDot).toHaveBeenCalledWith("dot1");
  expect(key(1)).toHaveAttribute("aria-pressed", "false");
});

test("a later click on a chord key is not swallowed when the browser sent none", () => {
  const { key, onToggleDot, onChord } = setup();
  fireEvent.pointerDown(key(1), touch(1, true));
  fireEvent.pointerDown(key(2), touch(2));
  fireEvent.pointerUp(key(1), touch(1, true));
  fireEvent.pointerUp(key(2), touch(2));
  expect(onChord).toHaveBeenCalledWith(cellOf(1, 2));

  // A screen reader double tap, with no pointer events of its own.
  const later = Date.now() + 5000;
  vi.spyOn(Date, "now").mockReturnValue(later);
  fireEvent.click(key(1));
  vi.restoreAllMocks();
  expect(onToggleDot).toHaveBeenCalledWith("dot1");
});

test("a cancelled touch drops the chord", () => {
  const { key, onToggleDot, onChord } = setup();
  fireEvent.pointerDown(key(1), touch(1, true));
  fireEvent.pointerDown(key(2), touch(2));
  fireEvent.pointerCancel(key(1), touch(1, true));
  fireEvent.pointerUp(key(2), touch(2));
  fireEvent.click(key(2));
  expect(onChord).not.toHaveBeenCalled();
  expect(onToggleDot).not.toHaveBeenCalled();
});

test("a mouse is never a chord", () => {
  const { key, onToggleDot, onChord } = setup();
  const mouse = { pointerId: 1, pointerType: "mouse", isPrimary: true };
  // A press that was dragged off and released elsewhere leaves nothing stuck.
  fireEvent.pointerDown(key(1), mouse);
  fireEvent.pointerDown(key(2), mouse);
  fireEvent.pointerUp(key(2), mouse);
  fireEvent.click(key(2));
  expect(onChord).not.toHaveBeenCalled();
  expect(onToggleDot).toHaveBeenCalledWith("dot2");
});

describe("physical keyboard", () => {
  test("chords work from the keys area and from any key, not outside", async () => {
    const { user, area, key, onChord } = setup();
    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.keyboard("f");
    expect(onChord).not.toHaveBeenCalled();

    await user.tab();
    expect(area).toHaveFocus();
    await user.keyboard("{f>}{j>}{/j}{/f}");
    expect(onChord).toHaveBeenLastCalledWith(cellOf(1, 4));

    key(5).focus();
    await user.keyboard("{d>}{k>}{/k}{/d}");
    expect(onChord).toHaveBeenLastCalledWith(cellOf(2, 5));
    expect(key(2)).toHaveAttribute("aria-pressed", "true");
    expect(key(1)).toHaveAttribute("aria-pressed", "false");
  });

  test("the keys area comes first, then the keys in Perkins order", async () => {
    const { user, area, key } = setup();
    await user.click(screen.getByRole("button", { name: "Before" }));
    await user.tab();
    expect(area).toHaveFocus();
    for (const dot of [3, 2, 1, 4, 5, 6]) {
      await user.tab();
      expect(key(dot)).toHaveFocus();
    }
  });

  test("Enter in the keys area checks, number keys and Backspace work", async () => {
    const { user, area, key, onSubmit } = setup();
    area.focus();
    await user.keyboard("3");
    expect(key(3)).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Backspace}");
    expect(key(3)).toHaveAttribute("aria-pressed", "false");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("on a touch-only device", () => {
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("coarse"),
    })) as typeof window.matchMedia;
  });

  afterEach(() => {
    // @ts-expect-error removing the stub again
    delete window.matchMedia;
  });

  test("folds the keyboard help away but keeps the keys and the touch help", () => {
    const { area } = setup();
    expect(screen.getByText("Typing on a keyboard?")).toBeInTheDocument();
    expect(screen.getByText(/hold/i)).not.toBeVisible();
    expect(screen.getByText(/press several keys at once/i)).toBeVisible();
    expect(within(area).getAllByRole("button")).toHaveLength(6);
  });
});
