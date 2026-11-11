import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { CellType, CLEAR_CELL } from "../game/braille";
import {
  BrailleKeysOptions,
  CHORD_KEYS,
  useBrailleKeys,
} from "./useBrailleKeys";

const cellOf = (...dots: number[]): CellType => {
  const cell = { ...CLEAR_CELL };
  dots.forEach((dot) => (cell[`dot${dot}` as keyof CellType] = true));
  return cell;
};

type HarnessProps = Partial<BrailleKeysOptions> & {
  onButton?: () => void;
};

const Harness = ({ onButton, ...options }: HarnessProps) => {
  useBrailleKeys({
    onToggleDot: () => {},
    onChord: () => {},
    onClear: () => {},
    ...options,
  });
  return (
    <>
      <input aria-label="Name" />
      <textarea aria-label="Notes" />
      <div contentEditable aria-label="Editor" role="textbox" />
      <input type="radio" aria-label="Dark theme" />
      <button type="button" onClick={onButton}>
        Next
      </button>
    </>
  );
};

const setup = (props: HarnessProps = {}) => {
  const handlers = {
    onToggleDot: vi.fn(),
    onChord: vi.fn(),
    onClear: vi.fn(),
    onSubmit: vi.fn(),
  };
  const user = userEvent.setup();
  const view = render(<Harness {...handlers} {...props} />);
  return { user, ...handlers, ...view };
};

describe("CHORD_KEYS", () => {
  test("maps the Perkins home row to the six dots", () => {
    expect(CHORD_KEYS).toEqual({
      KeyF: "dot1",
      KeyD: "dot2",
      KeyS: "dot3",
      KeyJ: "dot4",
      KeyK: "dot5",
      KeyL: "dot6",
    });
    expect(Object.isFrozen(CHORD_KEYS)).toBe(true);
  });
});

describe("chords", () => {
  test("a single key pressed alone is a one dot chord", async () => {
    const { user, onChord, onToggleDot } = setup();
    await user.keyboard("f");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(1));
    expect(onToggleDot).not.toHaveBeenCalled();
  });

  test("every chord key maps to its dot", async () => {
    const { user, onChord } = setup();
    await user.keyboard("fdsjkl");
    expect(onChord.mock.calls.map(([cell]) => cell)).toEqual(
      [1, 2, 3, 4, 5, 6].map((dot) => cellOf(dot))
    );
  });

  test("commits once, after every key of the chord is released", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{f>}{j>}{k>}");
    expect(onChord).not.toHaveBeenCalled();
    await user.keyboard("{/f}{/j}");
    expect(onChord).not.toHaveBeenCalled();
    await user.keyboard("{/k}");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(1, 4, 5));
  });

  test("keys can be pressed and released in any order", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{l>}{s>}{d>}{/s}{/l}{/d}");
    expect(onChord).toHaveBeenCalledWith(cellOf(2, 3, 6));

    await user.keyboard("{k>}{f>}{/k}{/f}");
    expect(onChord).toHaveBeenLastCalledWith(cellOf(1, 5));
    expect(onChord).toHaveBeenCalledTimes(2);
  });

  test("includes keys added and released while the chord is held", async () => {
    const { user, onChord } = setup();
    // f is held throughout; d comes and goes, then j joins.
    await user.keyboard("{f>}{d>}{/d}{j>}{/f}{/j}");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(1, 2, 4));
  });

  test("auto-repeat while holding a key does not add or commit anything", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{f>5}");
    expect(onChord).not.toHaveBeenCalled();
    await user.keyboard("{/f}");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(1));
  });

  test("uses the physical key, so a Greek layout works", () => {
    const { onChord } = setup();
    fireEvent.keyDown(document.body, { key: "φ", code: "KeyF" });
    fireEvent.keyDown(document.body, { key: "δ", code: "KeyD" });
    fireEvent.keyUp(document.body, { key: "φ", code: "KeyF" });
    fireEvent.keyUp(document.body, { key: "δ", code: "KeyD" });
    expect(onChord).toHaveBeenCalledWith(cellOf(1, 2));
  });

  test("other letters are not chord keys", async () => {
    const { user, onChord, onToggleDot } = setup();
    await user.keyboard("aeghq");
    expect(onChord).not.toHaveBeenCalled();
    expect(onToggleDot).not.toHaveBeenCalled();
  });

  test("a keyup without its keydown is ignored", () => {
    const { onChord } = setup();
    fireEvent.keyUp(document.body, { key: "f", code: "KeyF" });
    expect(onChord).not.toHaveBeenCalled();
  });

  test("a key whose keydown never arrived (ghosting) is simply missing", () => {
    const { onChord } = setup();
    fireEvent.keyDown(document.body, { key: "f", code: "KeyF" });
    fireEvent.keyDown(document.body, { key: "d", code: "KeyD" });
    // The keyboard dropped s.
    fireEvent.keyUp(document.body, { key: "s", code: "KeyS" });
    fireEvent.keyUp(document.body, { key: "f", code: "KeyF" });
    fireEvent.keyUp(document.body, { key: "d", code: "KeyD" });
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(1, 2));
  });
});

describe("modifier keys", () => {
  test("chord keys with Ctrl, Alt or Meta are left to the browser", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{Control>}f{/Control}");
    await user.keyboard("{Alt>}d{/Alt}");
    await user.keyboard("{Meta>}s{/Meta}");
    expect(onChord).not.toHaveBeenCalled();
  });

  test("a modifier released before the letter does not commit the letter", async () => {
    const { user, onChord } = setup();
    // Ctrl+F to find, with Ctrl let go first.
    await user.keyboard("{Control>}{f>}{/Control}{/f}");
    expect(onChord).not.toHaveBeenCalled();
  });

  test("a shortcut pressed mid-chord cancels the chord", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{f>}{Control>}{d>}{/d}{/Control}{/f}");
    expect(onChord).not.toHaveBeenCalled();

    await user.keyboard("j");
    expect(onChord).toHaveBeenCalledWith(cellOf(4));
  });

  test("number keys with a modifier are ignored", async () => {
    const { user, onToggleDot } = setup();
    await user.keyboard("{Control>}1{/Control}{Alt>}2{/Alt}");
    expect(onToggleDot).not.toHaveBeenCalled();
  });
});

describe("losing focus mid-chord", () => {
  test("window blur drops the chord instead of committing it", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{f>}{d>}");
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    // The keyups arrive late, after the user comes back.
    await user.keyboard("{/f}{/d}");
    expect(onChord).not.toHaveBeenCalled();

    await user.keyboard("k");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(5));
  });

  test("hiding the page drops the chord", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{f>}");
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    visibility.mockRestore();

    await user.keyboard("{/f}j");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(4));
  });

  test("moving focus into a text field mid-chord cancels it", async () => {
    const { user, onChord } = setup();
    await user.keyboard("{f>}");
    act(() => screen.getByLabelText("Name").focus());
    await user.keyboard("{/f}");
    expect(onChord).not.toHaveBeenCalled();
  });
});

describe("typing", () => {
  test.each(["Name", "Notes", "Editor"])(
    "keys typed in %s are left alone",
    async (label) => {
      const { user, onChord, onToggleDot, onClear, onSubmit } = setup();
      await user.click(screen.getByLabelText(label));
      await user.keyboard("fdsjkl123{Backspace}{Escape}{Enter}");
      expect(onChord).not.toHaveBeenCalled();
      expect(onToggleDot).not.toHaveBeenCalled();
      expect(onClear).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    }
  );

  test("text typed in a field still arrives", async () => {
    const { user } = setup();
    const input = screen.getByLabelText("Name");
    await user.click(input);
    await user.keyboard("fjord");
    expect(input).toHaveValue("fjord");
  });

  test("a focused radio button is not a text field", async () => {
    const { user, onToggleDot, onChord } = setup();
    act(() => screen.getByLabelText("Dark theme").focus());
    await user.keyboard("1f");
    expect(onToggleDot).toHaveBeenCalledWith("dot1");
    expect(onChord).toHaveBeenCalledWith(cellOf(1));
  });
});

describe("number keys, clear and submit", () => {
  test("number keys 1 to 6 toggle their dot on release", async () => {
    const { user, onToggleDot } = setup();
    await user.keyboard("{1>}");
    expect(onToggleDot).not.toHaveBeenCalled();
    await user.keyboard("{/1}23456");
    expect(onToggleDot.mock.calls).toEqual([
      ["dot1"],
      ["dot2"],
      ["dot3"],
      ["dot4"],
      ["dot5"],
      ["dot6"],
    ]);
  });

  test("0, 7, 8 and 9 do nothing", async () => {
    const { user, onToggleDot } = setup();
    await user.keyboard("0789");
    expect(onToggleDot).not.toHaveBeenCalled();
  });

  test("Escape and Backspace clear", async () => {
    const { user, onClear } = setup();
    await user.keyboard("{Escape}");
    expect(onClear).toHaveBeenCalledTimes(1);
    await user.keyboard("{Backspace}");
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  test("Backspace mid-chord clears and cancels the chord", async () => {
    const { user, onClear, onChord } = setup();
    await user.keyboard("{f>}{Backspace}{/f}");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChord).not.toHaveBeenCalled();
  });

  test("Enter submits", async () => {
    const { user, onSubmit } = setup();
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("holding Enter submits once", async () => {
    const { user, onSubmit } = setup();
    await user.keyboard("{Enter>4}{/Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("Enter without onSubmit does nothing", async () => {
    const user = userEvent.setup();
    render(<Harness onSubmit={undefined} />);
    await user.keyboard("{Enter}");
  });

  test("Enter on a focused button activates the button only", async () => {
    const onButton = vi.fn();
    const { user, onSubmit } = setup({ onButton });
    act(() => screen.getByRole("button", { name: "Next" }).focus());
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onButton).toHaveBeenCalledTimes(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("a button that moves focus on Enter does not also submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const Moving = () => {
      useBrailleKeys({
        onToggleDot: () => {},
        onChord: () => {},
        onClear: () => {},
        onSubmit,
      });
      const target = React.useRef<HTMLDivElement>(null);
      return (
        <>
          <button type="button" onClick={() => target.current?.focus()}>
            Start
          </button>
          <div ref={target} tabIndex={-1} data-testid="target" />
        </>
      );
    };
    render(<Moving />);
    act(() => screen.getByRole("button", { name: "Start" }).focus());
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("target")).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("a submit that moves focus to a button does not also press it", async () => {
    const onButton = vi.fn();
    const user = userEvent.setup();
    const Submitting = () => {
      const next = React.useRef<HTMLButtonElement>(null);
      useBrailleKeys({
        onToggleDot: () => {},
        onChord: () => {},
        onClear: () => {},
        onSubmit: () => next.current?.focus(),
      });
      return (
        <button type="button" ref={next} onClick={onButton}>
          Next
        </button>
      );
    };
    render(<Submitting />);
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(onButton).not.toHaveBeenCalled();
  });
});

describe("options", () => {
  test("enabled: false attaches nothing", async () => {
    const { user, onChord, onToggleDot, onClear, onSubmit } = setup({
      enabled: false,
    });
    await user.keyboard("f1{Escape}{Enter}");
    expect(onChord).not.toHaveBeenCalled();
    expect(onToggleDot).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("can be turned off and on again, dropping a chord in progress", async () => {
    const { user, onChord, rerender } = setup();
    const handlers = { onChord, onToggleDot: vi.fn(), onClear: vi.fn() };
    await user.keyboard("{f>}");
    rerender(<Harness {...handlers} enabled={false} />);
    await user.keyboard("{/f}");
    rerender(<Harness {...handlers} enabled />);
    await user.keyboard("d");
    expect(onChord).toHaveBeenCalledTimes(1);
    expect(onChord).toHaveBeenCalledWith(cellOf(2));
  });

  test("calls the latest callbacks without re-attaching listeners", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(
      <Harness onChord={first} onToggleDot={first} onClear={first} />
    );
    const attached = add.mock.calls.length;

    await user.keyboard("{f>}");
    // A new callback while the chord is held still gets the chord.
    rerender(
      <Harness onChord={second} onToggleDot={second} onClear={second} />
    );
    await user.keyboard("{/f}1{Escape}");

    expect(first).not.toHaveBeenCalled();
    expect(second.mock.calls).toEqual([[cellOf(1)], ["dot1"], []]);
    expect(add.mock.calls.length).toBe(attached);
    add.mockRestore();
  });

  test("removes its listeners on unmount", async () => {
    const { user, onChord, onToggleDot, unmount } = setup();
    unmount();
    await user.keyboard("f1");
    expect(onChord).not.toHaveBeenCalled();
    expect(onToggleDot).not.toHaveBeenCalled();
  });

  test("with chordArea, chord keys only work inside it", async () => {
    const onChord = vi.fn();
    const onToggleDot = vi.fn();
    const user = userEvent.setup();
    const Scoped = () => {
      const area = React.useRef<HTMLDivElement>(null);
      useBrailleKeys({
        onChord,
        onToggleDot,
        onClear: () => {},
        chordArea: area,
      });
      return <div ref={area} tabIndex={0} data-testid="area" />;
    };
    render(<Scoped />);

    await user.keyboard("f1");
    expect(onChord).not.toHaveBeenCalled();
    expect(onToggleDot).toHaveBeenCalledWith("dot1");

    act(() => screen.getByTestId("area").focus());
    await user.keyboard("{f>}{j>}");
    // Leaving mid-chord cancels it.
    act(() => screen.getByTestId("area").blur());
    await user.keyboard("{/f}{/j}");
    expect(onChord).not.toHaveBeenCalled();

    act(() => screen.getByTestId("area").focus());
    await user.keyboard("{f>}{j>}{/f}{/j}");
    expect(onChord).toHaveBeenCalledWith(cellOf(1, 4));
  });
});
