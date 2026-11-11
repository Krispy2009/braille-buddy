import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Practice } from "./Practice";

// With random() = 0 every question is "letter to dots": a, then e.
// With random() = 0.5 it is "dots to letter": h (dots 1, 2 and 5) in
// English, αι (dots 1, 2 and 6) in Greek.
const DAY = new Date(2026, 10, 11, 12);

const setup = (value = 0, now = () => DAY) => {
  const random = vi.fn(() => value);
  const user = userEvent.setup();
  const view = render(<Practice random={random} now={now} />);
  return { user, random, ...view };
};

const status = () => screen.getByRole("status");
const prompt = () => screen.getByRole("heading", { level: 2 });
const points = () => screen.getByText("Points").nextElementSibling;
const streak = () => screen.getByText("Daily streak").nextElementSibling;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("letter to dots", () => {
  test("names the letter and labels the cell with the question", () => {
    setup();
    expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
    expect(
      screen.getByRole("group", { name: /braille cell/i })
    ).toHaveAccessibleDescription("Write the letter a in braille");
    expect(status()).toHaveTextContent("");
  });

  test("keyboard: number keys raise dots, Enter checks and Enter moves on", async () => {
    const { user } = setup();

    await user.keyboard("1");
    expect(screen.getByRole("button", { name: "Dot 1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.keyboard("{Enter}");

    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dot 1 makes a in English."
    );
    const next = screen.getByRole("button", { name: "Next question" });
    expect(next).toHaveFocus();
    expect(points()).toHaveTextContent("10");
    expect(streak()).toHaveTextContent("1 day");

    await user.keyboard("{Enter}");
    expect(prompt()).toHaveAccessibleName("Write the letter e in braille");
    expect(prompt()).toHaveFocus();
    expect(status()).toHaveTextContent("");
    expect(screen.getByRole("button", { name: "Dot 1" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("clicks: a wrong answer shows and announces the right dots", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Dot 1" }));
    await user.click(screen.getByRole("button", { name: "Dot 4" }));
    await user.click(screen.getByRole("button", { name: "Check" }));

    expect(status()).toHaveTextContent(
      "Not quite. Dot 1 makes a in English. You raised dots 1 and 4."
    );
    expect(screen.getByText("Answer")).toBeInTheDocument();
    expect(points()).toHaveTextContent("0");
    // The cell is frozen: no dot buttons, and keys do nothing.
    expect(screen.queryByRole("button", { name: "Dot 1" })).not.toBeInTheDocument();
    await user.keyboard("2");
    expect(status()).toHaveTextContent("You raised dots 1 and 4.");

    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(prompt()).toHaveFocus();
    expect(screen.queryByText("Answer")).not.toBeInTheDocument();
  });

  test("Clear and Backspace empty the cell before checking", async () => {
    const { user } = setup();
    const dot1 = screen.getByRole("button", { name: "Dot 1" });

    await user.keyboard("12");
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(dot1).toHaveAttribute("aria-pressed", "false");

    await user.keyboard("1{Backspace}");
    expect(dot1).toHaveAttribute("aria-pressed", "false");
  });

  test("checking an empty cell asks for a dot instead of marking it wrong", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Raise at least one dot, then check your answer."
    );
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(localStorage.getItem("braille-buddy:progress")).toBeNull();
  });

  test("a chord typed in the braille keyboard answers, and focus returns there", async () => {
    const { user } = setup();
    const pad = screen.getByRole("application", { name: "Braille keyboard" });

    await user.click(pad);
    await user.keyboard("{f>}{/f}{Enter}");
    expect(status()).toHaveTextContent("Correct, plus 10 points.");
    expect(screen.getByRole("button", { name: "Next question" })).toHaveFocus();

    await user.keyboard("{Enter}");
    const nextPad = screen.getByRole("application", { name: "Braille keyboard" });
    expect(nextPad).toHaveFocus();
    // Focus skips the heading, so the pad reads the question first.
    expect(nextPad).toHaveAccessibleDescription(
      /^Write the letter e in braille Hold F D S/
    );

    // e is dots 1 and 5.
    await user.keyboard("{f>}{k>}{/k}{/f}{Enter}");
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 5 make e in English."
    );
    expect(points()).toHaveTextContent("20");
  });

  test("chords do nothing outside the braille keyboard", async () => {
    const { user } = setup();
    await user.keyboard("f");
    expect(screen.getByRole("button", { name: "Dot 1" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});

describe("dots to letter", () => {
  test("shows the cell, describes it in words and offers four choices", () => {
    setup(0.5);
    expect(prompt()).toHaveAccessibleName("Which letter has dots 1, 2 and 5?");
    const choices = screen.getByRole("group", {
      name: "Which letter has dots 1, 2 and 5?",
    });
    expect(
      within(choices)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["a", "r", "h", "e"]);
    // The picture is hidden from screen readers: the words describe it.
    expect(screen.queryByRole("button", { name: /^Dot/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("application")).not.toBeInTheDocument();
  });

  test("clicks: a right answer earns points and marks the choice", async () => {
    const { user } = setup(0.5);

    await user.click(screen.getByRole("button", { name: "h" }));
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1, 2 and 5 make h in English."
    );
    expect(screen.getByRole("button", { name: "h" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "h" })).toHaveAttribute(
      "data-mark",
      "right"
    );
    expect(screen.getByRole("button", { name: "Next question" })).toHaveFocus();
    expect(points()).toHaveTextContent("10");
  });

  test("keyboard: a wrong answer names the right letter and the chosen one", async () => {
    const { user } = setup(0.5);

    // Past the language radios, straight to the first choice.
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "a" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(status()).toHaveTextContent(
      "Not quite. Dots 1, 2 and 5 make h in English. You chose a, which is dot 1."
    );
    expect(screen.getByRole("button", { name: "a" })).toHaveAttribute(
      "data-mark",
      "wrong"
    );
    expect(screen.getByRole("button", { name: "h" })).toHaveAttribute(
      "data-mark",
      "right"
    );
    expect(points()).toHaveTextContent("0");

    await user.keyboard("{Enter}");
    expect(prompt()).toHaveFocus();
    expect(prompt()).toHaveAccessibleName(/^Which letter has/);
    expect(screen.getByRole("button", { name: "a" })).toBeEnabled();
  });
});

test("mixes both kinds of question", async () => {
  let value = 0;
  const user = userEvent.setup();
  render(<Practice random={() => value} now={() => DAY} />);

  expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
  await user.keyboard("1{Enter}");
  value = 0.5;
  await user.keyboard("{Enter}");
  expect(prompt()).toHaveAccessibleName("Which letter has dots 1, 2 and 5?");
});

test("never ends an announcement sentence on a single letter", async () => {
  const { user } = setup(0.5);
  await user.click(screen.getByRole("button", { name: "e" }));
  const text = status().textContent ?? "";
  expect(text).toMatch(/You chose e, which is dots 1 and 5\.$/);
  expect(text).not.toMatch(/(^|\s)\p{L}\./u);
});

describe("Greek", () => {
  test("choices are marked as Greek and named for screen readers", async () => {
    const { user } = setup(0.5);
    await user.click(screen.getByRole("radio", { name: "Greek" }));

    expect(prompt()).toHaveAccessibleName("Which letter has dots 1, 2 and 6?");
    const choice = screen.getByRole("button", { name: "alpha iota" });
    const glyph = within(choice).getByText("αι");
    expect(glyph).toHaveAttribute("lang", "el");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "eta upsilon" })).toBeInTheDocument();

    await user.click(choice);
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1, 2 and 6 make alpha iota in Greek."
    );
  });

  test("letter to dots names the Greek letter", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: "Greek" }));
    expect(prompt()).toHaveAccessibleName("Write the letter alpha in braille");
    expect(within(prompt()).getByText("α")).toHaveAttribute("lang", "el");

    await user.keyboard("2");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Not quite. Dot 1 makes alpha in Greek. You raised dot 2."
    );
  });
});

test("switching language starts a new question and remembers the choice", async () => {
  const { user, unmount } = setup();
  await user.keyboard("1");

  const greek = screen.getByRole("radio", { name: "Greek" });
  await user.click(greek);
  expect(greek).toBeChecked();
  expect(greek).toHaveFocus();
  expect(prompt()).toHaveAccessibleName("Write the letter alpha in braille");
  expect(screen.getByRole("button", { name: "Dot 1" })).toHaveAttribute(
    "aria-pressed",
    "false"
  );
  expect(localStorage.getItem("braille-buddy:practice-language")).toBe("greek");

  unmount();
  setup();
  expect(screen.getByRole("radio", { name: "Greek" })).toBeChecked();
});

test("keeps points and streak across a remount", async () => {
  const { user, unmount } = setup();
  expect(points()).toHaveTextContent("0");
  expect(streak()).toHaveTextContent("0 days");

  await user.keyboard("1{Enter}");
  unmount();

  setup();
  expect(points()).toHaveTextContent("10");
  expect(streak()).toHaveTextContent("1 day");
});

test("continues yesterday's streak", async () => {
  localStorage.setItem(
    "braille-buddy:progress",
    JSON.stringify({
      version: 1,
      points: 40,
      streak: 3,
      bestStreak: 3,
      lastPlayed: "2026-11-10",
      letters: {},
    })
  );
  const { user } = setup();
  expect(points()).toHaveTextContent("40");
  expect(streak()).toHaveTextContent("3 days");

  await user.keyboard("1{Enter}");
  expect(points()).toHaveTextContent("50");
  expect(streak()).toHaveTextContent("4 days");
  // Totals are shown, not announced.
  expect(status()).not.toHaveTextContent(/50|4 days/);
});

test("still works when storage throws", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const { user } = setup();

  await user.keyboard("1{Enter}");
  expect(status()).toHaveTextContent("Correct, plus 10 points.");
  expect(points()).toHaveTextContent("10");

  await user.click(screen.getByRole("radio", { name: "Greek" }));
  expect(prompt()).toHaveAccessibleName("Write the letter alpha in braille");
});

test("passes its random source to the review picker", () => {
  const { random } = setup();
  expect(random).toHaveBeenCalled();
});
