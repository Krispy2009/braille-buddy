import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CellType, CLEAR_CELL } from "../../game/braille";
import { useBrailleKeys } from "../../hooks/useBrailleKeys";
import { ChordPad } from "./ChordPad";

const Practice = ({
  onChord,
  onToggleDot,
  canSubmit,
}: {
  onChord: (cell: CellType) => void;
  onToggleDot: (dot: keyof CellType) => void;
  canSubmit?: boolean;
}) => {
  const pad = React.useRef<HTMLDivElement>(null);
  useBrailleKeys({ onChord, onToggleDot, onClear: () => {}, chordArea: pad });
  return (
    <>
      <button type="button">Before</button>
      <ChordPad ref={pad} canSubmit={canSubmit} />
      <button type="button">After</button>
    </>
  );
};

const setup = (canSubmit?: boolean) => {
  const onChord = vi.fn();
  const onToggleDot = vi.fn();
  const user = userEvent.setup();
  render(
    <Practice
      onChord={onChord}
      onToggleDot={onToggleDot}
      canSubmit={canSubmit}
    />
  );
  const pad = screen.getByRole("application", { name: "Braille keyboard" });
  return { user, onChord, onToggleDot, pad };
};

test("is a focusable application with a name and instructions", () => {
  const { pad } = setup();
  expect(pad).toHaveAttribute("tabindex", "0");
  expect(pad).toHaveAccessibleDescription(
    /hold f d s for dots 1 2 3 and j k l for dots 4 5 6 together.*press tab to leave/i
  );
  expect(pad).not.toHaveAccessibleDescription(/enter/i);
});

test("mentions Enter when the answer can be submitted", () => {
  const { pad } = setup(true);
  expect(pad).toHaveAccessibleDescription(/enter checks your answer/i);
});

test("instructions stay readable outside the application", () => {
  setup();
  const help = screen.getByText(/perkins brailler/i);
  expect(help.closest('[role="application"]')).toBeNull();
});

test("chords only work while the pad has focus", async () => {
  const { user, onChord, pad } = setup();
  await user.keyboard("f");
  expect(onChord).not.toHaveBeenCalled();

  await user.click(pad);
  expect(pad).toHaveFocus();
  await user.keyboard("{f>}{k>}{/f}{/k}");
  expect(onChord).toHaveBeenCalledWith({
    ...CLEAR_CELL,
    dot1: true,
    dot5: true,
  });
});

test("number keys work inside and outside the pad", async () => {
  const { user, onToggleDot, pad } = setup();
  await user.keyboard("1");
  await user.click(pad);
  await user.keyboard("2");
  expect(onToggleDot.mock.calls).toEqual([["dot1"], ["dot2"]]);
});

test("shows when chord typing is on", async () => {
  const { user, pad } = setup();
  expect(pad).toHaveAttribute("data-active", "false");
  expect(screen.getByText(/tab here to type chords/i)).toBeInTheDocument();

  await user.tab();
  await user.tab();
  expect(pad).toHaveFocus();
  expect(pad).toHaveAttribute("data-active", "true");
  expect(screen.getByText("Chord typing is on")).toBeInTheDocument();
});

test("does not trap the keyboard", async () => {
  const { user, pad } = setup();
  await user.click(pad);
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  expect(pad).toHaveAttribute("data-active", "false");

  await user.tab({ shift: true });
  await user.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Before" })).toHaveFocus();
});

test("shows the Perkins key layout", () => {
  const { pad } = setup();
  const keys = Array.from(pad.querySelectorAll("kbd")).map(
    (kbd) => kbd.textContent
  );
  expect(keys).toEqual(["S", "D", "F", "J", "K", "L"]);
});
