import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Language } from "../../game/braille";
import type { DotEntry } from "../../game/settings";
import { Practice } from "./Practice";

// In the first English lesson (a to e), random() = 0 asks "letter to dots":
// a, then b. random() = 0.5 asks "dots to letter" for c (dots 1 and 4).
const DAY = new Date(2026, 10, 11, 12);
const STORAGE_KEY = "braille-buddy:progress";

type Options = { language?: Language; dotEntry?: DotEntry };

// The course and the entry mode come from Settings, which lives in App.
const practice = (
  random: () => number,
  now: () => Date,
  { language = "english", dotEntry = "cell" }: Options = {},
  onChangeCourse = () => {}
) => (
  <Practice
    language={language}
    dotEntry={dotEntry}
    onChangeCourse={onChangeCourse}
    random={random}
    now={now}
  />
);

const setup = (value = 0, now = () => DAY, options: Options = {}) => {
  const random = vi.fn(() => value);
  const onChangeCourse = vi.fn();
  const user = userEvent.setup();
  const view = render(practice(random, now, options, onChangeCourse));
  const switchTo = (next: Options) =>
    view.rerender(practice(random, now, { ...options, ...next }, onChangeCourse));
  return { user, random, onChangeCourse, switchTo, ...view };
};

const startButton = (name: string) => screen.getByRole("button", { name });
const start = async (
  user: ReturnType<typeof userEvent.setup>,
  name = "Start Letters a to e"
) => user.click(startButton(name));

const status = () => screen.getByRole("status");
const screenHeading = () => screen.getByRole("heading", { level: 2 });
const prompt = () => screen.getByRole("heading", { level: 3 });
const term = (name: string) => screen.getByText(name).nextElementSibling;
const points = () => term("Total points");
const englishPoints = () => term("English points");
const streak = () => term("Daily streak");
/** Saved progress: the score is not shown while a question is on screen. */
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");

type Saved = {
  points?: number;
  streak?: number;
  bestStreak?: number;
  lastPlayed?: string | null;
  letters?: Record<string, { correct: number; wrong: number; box: number }>;
  completedLessons?: Record<string, string[]>;
};

const save = (data: Saved) =>
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      points: 0,
      streak: 0,
      bestStreak: 0,
      lastPlayed: null,
      letters: {},
      completedLessons: {},
      ...data,
    })
  );

const boxes = (course: string, letters: string[], box: number) =>
  Object.fromEntries(
    letters.map((letter) => [`${course}:${letter}`, { correct: box, wrong: 0, box }])
  );

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lesson list", () => {
  test("first visit: the first lesson is open and the rest are locked", () => {
    setup();
    expect(screenHeading()).toHaveAccessibleName("English lessons");
    expect(screen.getByText("0 of 5 lessons done.")).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "English lessons" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    expect(
      within(list)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "Letters a to e",
      "Letters f to j",
      "Letters k to o",
      "Letters p to t",
      "Letters u to z",
    ]);

    const first = startButton("Start Letters a to e");
    expect(first).not.toHaveAttribute("aria-disabled");
    expect(first).toHaveAccessibleDescription("Next. 0 of 5 letters learnt.");
    expect(startButton("Start Letters f to j")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    // Nothing to mix before a lesson is done.
    expect(
      screen.queryByRole("button", { name: "Practise everything so far" })
    ).not.toBeInTheDocument();
    // No timers, no live region on the list.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("a locked lesson stays in the Tab order, explains why, and does not start", async () => {
    const { user } = setup();
    const locked = startButton("Start Letters f to j");
    expect(locked).toHaveAccessibleDescription(
      "Locked. Finish Letters a to e first."
    );
    expect(screen.getByText("Finish Letters a to e first.")).toBeVisible();

    await user.tab();
    await user.tab();
    await user.tab();
    expect(locked).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.click(locked);
    expect(screenHeading()).toHaveAccessibleName("English lessons");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("lists the letters of each lesson, Greek ones by name", () => {
    const { switchTo } = setup();
    expect(
      screen.getAllByRole("listitem")[0].querySelector(".lesson-letters")
    ).toHaveTextContent("Letters: a, b, c, d, e");

    switchTo({ language: "greek" });
    const letters = screen.getAllByRole("listitem")[0].querySelector(".lesson-letters");
    expect(letters).toHaveTextContent(/alpha, β?beta/);
    expect(within(letters as HTMLElement).getByText("α")).toHaveAttribute("lang", "el");
  });

  test("shows course points next to total points and streak, quietly", () => {
    save({
      points: 80,
      lastPlayed: "2026-11-11",
      streak: 2,
      bestStreak: 2,
      letters: {
        "english:a": { correct: 3, wrong: 0, box: 3 },
        "greek:α": { correct: 5, wrong: 0, box: 4 },
      },
    });
    setup();
    expect(englishPoints()).toHaveTextContent("30");
    expect(points()).toHaveTextContent("80");
    expect(streak()).toHaveTextContent("2 days");
    expect(screen.getByText("Total points").closest("[aria-live], [role=status]")).toBeNull();
  });
});

const KEY_LETTERS = ["F", "D", "S", "J", "K", "L"];
/** The button that raises a dot: a brailler key, or a dot of the cell. */
const dotName = (dotEntry: DotEntry, dot: number) =>
  dotEntry === "keys" ? `Dot ${dot}, key ${KEY_LETTERS[dot - 1]}` : `Dot ${dot}`;
const dotButton = (dotEntry: DotEntry, dot: number) =>
  screen.getByRole("button", { name: dotName(dotEntry, dot) });

describe("letter to dots", () => {
  test("entering a lesson focuses its heading, then asks from its letters", async () => {
    const { user } = setup();
    await start(user);

    expect(screenHeading()).toHaveAccessibleName("English: Letters a to e");
    expect(screenHeading()).toHaveFocus();
    expect(screen.getByText("0 of 5 letters learnt")).toBeInTheDocument();
    expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
    // A new player taps the cell's dots.
    expect(
      screen.getByRole("group", { name: /braille cell/i })
    ).toHaveAccessibleDescription("Write the letter a in braille");
    expect(screen.queryByRole("application", { name: "Brailler keys" })).not.toBeInTheDocument();
    expect(status()).toHaveTextContent("");
    // Points and streak stay on the lesson list, away from the question.
    expect(screen.queryByText("Total points")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily streak")).not.toBeInTheDocument();
  });

  test("Brailler keys: the keys are the buttons, the cell only shows", async () => {
    const { user } = setup(0, undefined, { dotEntry: "keys" });
    await start(user);
    expect(
      screen.getByRole("application", { name: "Brailler keys" })
    ).toHaveAccessibleDescription(/^Write the letter a in braille On a keyboard/);
    expect(
      screen.queryByRole("group", { name: /braille cell/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("application", { name: "Braille keyboard" })).not.toBeInTheDocument();
  });

  describe.each(["keys", "cell"] as const)("with %s", (dotEntry) => {
    const setupMode = () => setup(0, undefined, { dotEntry });

    test("keyboard: number keys raise dots, Enter checks and Enter moves on", async () => {
      const { user } = setupMode();
      await start(user);

      await user.keyboard("1");
      expect(dotButton(dotEntry, 1)).toHaveAttribute("aria-pressed", "true");
      await user.keyboard("{Enter}");

      expect(status()).toHaveTextContent(
        "Correct, plus 10 points. Dot 1 makes a in English."
      );
      const next = screen.getByRole("button", { name: "Next question" });
      expect(next).toHaveFocus();
      expect(saved()).toMatchObject({ points: 10, streak: 1 });

      await user.keyboard("{Enter}");
      expect(prompt()).toHaveAccessibleName("Write the letter b in braille");
      expect(prompt()).toHaveFocus();
      expect(status()).toHaveTextContent("");
      expect(dotButton(dotEntry, 1)).toHaveAttribute("aria-pressed", "false");
    });

    test("clicks: a wrong answer shows and announces the right dots", async () => {
      const { user } = setupMode();
      await start(user);

      await user.click(dotButton(dotEntry, 1));
      await user.click(dotButton(dotEntry, 4));
      await user.click(screen.getByRole("button", { name: "Check" }));

      expect(status()).toHaveTextContent(
        "Not quite. Dot 1 makes a in English. You raised dots 1 and 4."
      );
      expect(screen.getByText("Answer")).toBeInTheDocument();
      expect(saved().points).toBe(0);
      // The cell is frozen: no dot buttons, and keys do nothing.
      expect(screen.queryByRole("button", { name: /^Dot 1/ })).not.toBeInTheDocument();
      await user.keyboard("2");
      expect(status()).toHaveTextContent("You raised dots 1 and 4.");

      await user.click(screen.getByRole("button", { name: "Next question" }));
      expect(prompt()).toHaveFocus();
      expect(screen.queryByText("Answer")).not.toBeInTheDocument();
    });

    test("clicks: a right answer, b with dots 1 and 2", async () => {
      const { user } = setupMode();
      await start(user);
      await user.keyboard("1{Enter}{Enter}");
      expect(prompt()).toHaveAccessibleName("Write the letter b in braille");

      await user.click(dotButton(dotEntry, 2));
      await user.click(dotButton(dotEntry, 1));
      expect(dotButton(dotEntry, 1)).toHaveAttribute("aria-pressed", "true");
      expect(dotButton(dotEntry, 2)).toHaveAttribute("aria-pressed", "true");
      await user.click(screen.getByRole("button", { name: "Check" }));
      expect(status()).toHaveTextContent(
        "Correct, plus 10 points. Dots 1 and 2 make b in English."
      );
      expect(saved().points).toBe(20);
    });

    test("Clear and Backspace empty the cell before checking", async () => {
      const { user } = setupMode();
      await start(user);
      const dot1 = dotButton(dotEntry, 1);

      await user.keyboard("12");
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(dot1).toHaveAttribute("aria-pressed", "false");

      await user.keyboard("1{Backspace}");
      expect(dot1).toHaveAttribute("aria-pressed", "false");
    });

    test("chords do nothing outside the chord area", async () => {
      const { user } = setupMode();
      await start(user);
      await user.keyboard("f");
      expect(dotButton(dotEntry, 1)).toHaveAttribute("aria-pressed", "false");
    });
  });

  test("checking an empty cell asks for a dot instead of marking it wrong", async () => {
    const { user } = setup();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Raise at least one dot, then check your answer."
    );
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("Tap the cell: a chord typed in the braille keyboard answers, and focus returns there", async () => {
    const { user } = setup(0, undefined, { dotEntry: "cell" });
    await start(user);
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
      /^Write the letter b in braille Hold F D S/
    );

    // b is dots 1 and 2.
    await user.keyboard("{f>}{d>}{/d}{/f}{Enter}");
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 2 make b in English."
    );
    expect(saved().points).toBe(20);
  });

  test("Brailler keys: a chord typed in the keys answers, and focus returns there", async () => {
    const { user } = setup(0, undefined, { dotEntry: "keys" });
    await start(user);
    const keys = screen.getByRole("application", { name: "Brailler keys" });

    // The keys area is the first Tab stop after the heading.
    await user.tab();
    expect(keys).toHaveFocus();
    await user.keyboard("{f>}{/f}{Enter}");
    expect(status()).toHaveTextContent("Correct, plus 10 points.");
    expect(screen.getByRole("button", { name: "Next question" })).toHaveFocus();

    await user.keyboard("{Enter}");
    const nextKeys = screen.getByRole("application", { name: "Brailler keys" });
    expect(nextKeys).toHaveFocus();
    expect(nextKeys).toHaveAccessibleDescription(
      /^Write the letter b in braille On a keyboard, while the brailler keys have focus/
    );

    await user.keyboard("{f>}{d>}{/d}{/f}{Enter}");
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 2 make b in English."
    );
    expect(saved().points).toBe(20);
  });

  test("Brailler keys: Tab, Space and Enter on the keys, then Check", async () => {
    const { user } = setup(0, undefined, { dotEntry: "keys" });
    await start(user);
    await user.tab(); // the keys area
    await user.tab(); // dot 3, the first key in Perkins order
    expect(dotButton("keys", 3)).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(dotButton("keys", 1)).toHaveFocus();
    // On a single key Enter toggles it, once, and does not check.
    await user.keyboard("{Enter}");
    expect(dotButton("keys", 1)).toHaveAttribute("aria-pressed", "true");
    expect(status()).toHaveTextContent("");
    await user.keyboard(" ");
    expect(dotButton("keys", 1)).toHaveAttribute("aria-pressed", "false");
    await user.keyboard(" ");
    expect(dotButton("keys", 1)).toHaveAttribute("aria-pressed", "true");

    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole("button", { name: "Check" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(status()).toHaveTextContent("Correct, plus 10 points.");
    // Answered from the Check button, so the next question focuses the prompt.
    await user.keyboard("{Enter}");
    expect(prompt()).toHaveFocus();
  });
});

describe("dots to letter", () => {
  test("offers four choices from the lesson's letters", async () => {
    const { user } = setup(0.5);
    await start(user);
    expect(prompt()).toHaveAccessibleName("Which letter has dots 1 and 4?");
    const choices = screen.getByRole("group", {
      name: "Which letter has dots 1 and 4?",
    });
    const letters = within(choices)
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(letters).toHaveLength(4);
    expect(letters).toContain("c");
    for (const letter of letters) {
      expect(["a", "b", "c", "d", "e"]).toContain(letter);
    }
    // The picture is hidden from screen readers: the words describe it.
    expect(screen.queryByRole("button", { name: /^Dot/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("application")).not.toBeInTheDocument();
  });

  test("a later lesson mixes in a letter met earlier", async () => {
    save({ completedLessons: { english: ["a-e"] } });
    const { user } = setup(0.5);
    await start(user, "Start Letters f to j");
    const letters = within(screen.getByRole("group", { name: /^Which letter/ }))
      .getAllByRole("button")
      .map((button) => button.textContent ?? "");
    expect(letters.filter((letter) => "abcde".includes(letter))).toHaveLength(1);
    expect(letters.filter((letter) => "fghij".includes(letter))).toHaveLength(3);
  });

  test("clicks: a right answer earns points and marks the choice", async () => {
    const { user } = setup(0.5);
    await start(user);

    await user.click(screen.getByRole("button", { name: "c" }));
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 4 make c in English."
    );
    expect(screen.getByRole("button", { name: "c" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "c" })).toHaveAttribute(
      "data-mark",
      "right"
    );
    expect(screen.getByRole("button", { name: "Next question" })).toHaveFocus();
    expect(saved().points).toBe(10);
  });

  test("keyboard: a wrong answer names the right letter and the chosen one", async () => {
    const { user } = setup(0.5);
    await start(user);

    // From the lesson heading straight to the first choice.
    await user.tab();
    const first = within(screen.getByRole("group", { name: /^Which letter/ }))
      .getAllByRole("button")[0];
    expect(first).toHaveFocus();
    const chosen = first.textContent;
    expect(chosen).not.toBe("c");
    await user.keyboard("{Enter}");

    expect(status()).toHaveTextContent(
      new RegExp(`^Not quite\\. Dots 1 and 4 make c in English\\. You chose ${chosen}, which is`)
    );
    expect(first).toHaveAttribute("data-mark", "wrong");
    expect(screen.getByRole("button", { name: "c" })).toHaveAttribute(
      "data-mark",
      "right"
    );
    expect(saved().points).toBe(0);

    await user.keyboard("{Enter}");
    expect(prompt()).toHaveFocus();
    expect(prompt()).toHaveAccessibleName(/^Which letter has/);
  });
});

test("mixes both kinds of question", async () => {
  let value = 0;
  const user = userEvent.setup();
  render(practice(() => value, () => DAY));
  await start(user);

  expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
  await user.keyboard("1{Enter}");
  value = 0.5;
  await user.keyboard("{Enter}");
  expect(prompt()).toHaveAccessibleName(/^Which letter has/);
});

test("never ends an announcement sentence on a single letter", async () => {
  const { user } = setup(0.5);
  await start(user);
  await user.click(screen.getByRole("button", { name: "e" }));
  const text = status().textContent ?? "";
  expect(text).toMatch(/You chose e, which is dots 1 and 5\.$/);
  expect(text).not.toMatch(/(^|\s)\p{L}\./u);
});

describe("Greek", () => {
  test("choices are marked as Greek and named for screen readers", async () => {
    const { user } = setup(0.5, undefined, { language: "greek" });
    expect(screenHeading()).toHaveAccessibleName("Greek lessons");
    await start(user, "Start Alpha to zeta");

    expect(prompt()).toHaveAccessibleName("Which letter has dots 1, 4 and 5?");
    const choice = screen.getByRole("button", { name: "delta" });
    const glyph = within(choice).getByText("δ");
    expect(glyph).toHaveAttribute("lang", "el");
    expect(glyph).toHaveAttribute("aria-hidden", "true");

    await user.click(choice);
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1, 4 and 5 make delta in Greek."
    );
  });

  test("letter to dots names the Greek letter", async () => {
    const { user } = setup(0, undefined, { language: "greek" });
    await start(user, "Start Alpha to zeta");
    expect(prompt()).toHaveAccessibleName("Write the letter alpha in braille");
    expect(within(prompt()).getByText("α")).toHaveAttribute("lang", "el");

    await user.keyboard("2");
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Not quite. Dot 1 makes alpha in Greek. You raised dot 2."
    );
  });
});

describe("finishing a lesson", () => {
  // a to d are learnt and e needs one more right answer. With random() = 0.5
  // the question is "which letter has dots 1 and 5?", whose answer is e.
  const nearlyDone = () =>
    save({
      letters: { ...boxes("english", ["a", "b", "c", "d"], 4), ...boxes("english", ["e"], 1) },
    });

  test("announces it once, opens the next lesson and keeps it after a remount", async () => {
    nearlyDone();
    const { user, unmount } = setup(0.5);
    await start(user, "Continue Letters a to e");
    expect(screen.getByText("4 of 5 letters learnt")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "e" }));
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 5 make e in English. " +
        "You have finished the lesson Letters a to e, and Letters f to j is now open."
    );
    expect(status().textContent).not.toMatch(/(^|\s)\p{L}\./u);
    expect(screen.getByText("5 of 5 letters learnt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next lesson" })).toHaveFocus();
    expect(screen.getAllByRole("button", { name: "Back to lessons" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Keep practising" })).toBeInTheDocument();
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").completedLessons
    ).toEqual({ english: ["a-e"] });

    // Keeping on in the same lesson doesn't announce it again.
    await user.click(screen.getByRole("button", { name: "Keep practising" }));
    expect(prompt()).toHaveFocus();
    await user.click(
      within(screen.getByRole("group", { name: /^Which letter/ })).getAllByRole("button")[0]
    );
    expect(status()).not.toHaveTextContent("finished");
    expect(screen.queryByRole("button", { name: "Next lesson" })).not.toBeInTheDocument();

    unmount();
    setup();
    expect(screen.getByText("1 of 5 lessons done.")).toBeInTheDocument();
    // Done stays done, even if the answer after it was a slip.
    expect(startButton("Practise again Letters a to e")).toHaveAccessibleDescription(
      /^Done\. [45] of 5 letters learnt\.$/
    );
    const second = startButton("Start Letters f to j");
    expect(second).not.toHaveAttribute("aria-disabled");
    expect(second).toHaveAccessibleDescription("Next. 0 of 5 letters learnt.");
    expect(startButton("Start Letters k to o")).toHaveAccessibleDescription(
      "Locked. Finish Letters f to j first."
    );
  });

  test("Next lesson opens it with focus on its heading", async () => {
    nearlyDone();
    const { user } = setup(0.5);
    await start(user, "Continue Letters a to e");
    await user.click(screen.getByRole("button", { name: "e" }));
    await user.keyboard("{Enter}");

    expect(screenHeading()).toHaveAccessibleName("English: Letters f to j");
    expect(screenHeading()).toHaveFocus();
    expect(status()).toHaveTextContent("");
    expect(screen.getByText("0 of 5 letters learnt")).toBeInTheDocument();
  });

  test("Back to lessons puts focus on the lesson just finished", async () => {
    nearlyDone();
    const { user } = setup(0.5);
    await start(user, "Continue Letters a to e");
    await user.click(screen.getByRole("button", { name: "e" }));
    await user.click(screen.getAllByRole("button", { name: "Back to lessons" })[1]);

    expect(screenHeading()).toHaveAccessibleName("English lessons");
    expect(startButton("Practise again Letters a to e")).toHaveFocus();
  });

  test("the last lesson of a course ends with plain congratulations", async () => {
    save({
      completedLessons: { english: ["a-e", "f-j", "k-o", "p-t"] },
      letters: {
        ...boxes("english", ["u", "v", "w", "x", "y"], 4),
        ...boxes("english", ["z"], 1),
      },
    });
    const { user } = setup(0.5);
    await start(user, "Continue Letters u to z");
    // z is dots 1, 3, 5 and 6.
    await user.click(screen.getByRole("button", { name: "z" }));

    expect(status()).toHaveTextContent(
      "You have finished Letters u to z, the last lesson in the English course. " +
        "Congratulations, you have learnt every letter it teaches."
    );
    expect(screen.queryByRole("button", { name: "Next lesson" })).not.toBeInTheDocument();
    const back = screen.getAllByRole("button", { name: "Back to lessons" })[1];
    expect(back).toHaveFocus();

    await user.click(back);
    expect(screen.getByText("5 of 5 lessons done.")).toBeInTheDocument();
    expect(startButton("Practise again Letters u to z")).toHaveFocus();
  });
});

describe("going back and replaying", () => {
  test("Back to lessons from a lesson focuses that lesson's button", async () => {
    const { user } = setup();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Back to lessons" }));
    expect(screenHeading()).toHaveAccessibleName("English lessons");
    expect(startButton("Start Letters a to e")).toHaveFocus();
  });

  test("a done lesson can be played again", async () => {
    save({ completedLessons: { english: ["a-e"] } });
    const { user } = setup();
    await start(user, "Practise again Letters a to e");
    expect(screenHeading()).toHaveAccessibleName("English: Letters a to e");
    expect(screenHeading()).toHaveFocus();
    expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
  });

  test("practise everything mixes every letter met so far", async () => {
    save({ completedLessons: { english: ["a-e"] } });
    const { user } = setup(0.99);
    const everything = screen.getByRole("button", {
      name: "Practise everything so far",
    });
    expect(everything).toHaveAccessibleDescription(
      "Mix the 10 letters from your finished lessons and the next one."
    );

    await user.click(everything);
    expect(screenHeading()).toHaveAccessibleName("English: Everything so far");
    expect(screenHeading()).toHaveFocus();
    expect(screen.getByText("0 of 10 letters learnt")).toBeInTheDocument();
    // random() = 0.99 picks the last letter met: j, dots 2, 4 and 5.
    expect(prompt()).toHaveAccessibleName("Which letter has dots 2, 4 and 5?");

    await user.click(screen.getByRole("button", { name: "Back to lessons" }));
    expect(
      screen.getByRole("button", { name: "Practise everything so far" })
    ).toHaveFocus();
  });
});

test("each course keeps its own lesson progress", () => {
  save({ completedLessons: { english: ["a-e"] } });
  const { switchTo } = setup();
  expect(screen.getByText("1 of 5 lessons done.")).toBeInTheDocument();

  switchTo({ language: "greek" });
  expect(screenHeading()).toHaveAccessibleName("Greek lessons");
  expect(screen.getByText("0 of 6 lessons done.")).toBeInTheDocument();
  expect(startButton("Start Alpha to zeta")).not.toHaveAttribute("aria-disabled");
  expect(startButton("Start Eta to mu")).toHaveAttribute("aria-disabled", "true");

  switchTo({ language: "english" });
  expect(screen.getByText("1 of 5 lessons done.")).toBeInTheDocument();
});

test("the lesson list names its course and offers to change it", async () => {
  const { user, onChangeCourse } = setup();
  // The course is chosen in Settings, not here.
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screenHeading()).toHaveAccessibleName("English lessons");
  await user.click(screen.getByRole("button", { name: "Change course" }));
  expect(onChangeCourse).toHaveBeenCalledTimes(1);
});

test("keeps points and streak across a remount", async () => {
  const { user, unmount } = setup();
  expect(points()).toHaveTextContent("0");
  expect(streak()).toHaveTextContent("0 days");

  await start(user);
  await user.keyboard("1{Enter}");
  unmount();

  setup();
  expect(points()).toHaveTextContent("10");
  expect(streak()).toHaveTextContent("1 day");
  expect(startButton("Start Letters a to e")).toHaveAccessibleDescription(
    "Next. 0 of 5 letters learnt."
  );
});

test("loads progress saved before lessons existed", async () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      points: 40,
      streak: 3,
      bestStreak: 3,
      lastPlayed: "2026-11-10",
      letters: { "english:a": { correct: 2, wrong: 0, box: 2 } },
    })
  );
  const { user } = setup();
  expect(points()).toHaveTextContent("40");
  expect(englishPoints()).toHaveTextContent("20");
  expect(streak()).toHaveTextContent("3 days");
  expect(startButton("Continue Letters a to e")).toHaveAccessibleDescription(
    "Next. 1 of 5 letters learnt."
  );

  await start(user, "Continue Letters a to e");
  await user.keyboard("1{Enter}");
  // Totals are shown on the lesson list, not announced.
  expect(status()).not.toHaveTextContent(/50|4 days/);
  await user.click(screen.getByRole("button", { name: "Back to lessons" }));
  expect(points()).toHaveTextContent("50");
  expect(streak()).toHaveTextContent("4 days");
});

test("still works when storage throws", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const { user } = setup();
  expect(screenHeading()).toHaveAccessibleName("English lessons");

  await start(user);
  await user.keyboard("1{Enter}");
  expect(status()).toHaveTextContent("Correct, plus 10 points.");

  await user.click(screen.getByRole("button", { name: "Back to lessons" }));
  expect(screenHeading()).toHaveAccessibleName("English lessons");
  expect(points()).toHaveTextContent("10");
});

test("passes its random source to the review picker", async () => {
  const { user, random } = setup();
  expect(random).not.toHaveBeenCalled();
  await start(user);
  expect(random).toHaveBeenCalled();
});
