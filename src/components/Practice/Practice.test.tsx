import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { Language } from "../../game/braille";
import { loadProgress, saveProgress } from "../../game/progress";
import type { DotEntry } from "../../game/settings";
import { Practice } from "./Practice";

// In the first English lesson (a to e), random() = 0 asks "letter to dots":
// a, then b. random() = 0.5 asks "dots to letter" for c (dots 1 and 4).
const DAY = new Date(2026, 10, 11, 12);
const STORAGE_KEY = "braille-buddy:progress";

type Options = { language?: Language; dotEntry?: DotEntry };

// The course and the entry mode come from Settings, and progress from App,
// which loads and saves it as this harness does.
type HarnessProps = {
  random: () => number;
  now: () => Date;
  options: Options;
  onChangeCourse: () => void;
  onHome: () => void;
};

const Harness = ({ random, now, options, onChangeCourse, onHome }: HarnessProps) => {
  const { language = "english", dotEntry = "cell" } = options;
  const [progress, setProgress] = React.useState(() => loadProgress());
  return (
    <Practice
      language={language}
      dotEntry={dotEntry}
      progress={progress}
      onProgress={(next) => {
        setProgress(next);
        saveProgress(next);
      }}
      onChangeCourse={onChangeCourse}
      onHome={onHome}
      random={random}
      now={now}
    />
  );
};

const practice = (
  random: () => number,
  now: () => Date,
  options: Options = {},
  onChangeCourse = () => {},
  onHome = () => {}
) => (
  <Harness
    random={random}
    now={now}
    options={options}
    onChangeCourse={onChangeCourse}
    onHome={onHome}
  />
);

const setup = (value = 0, now = () => DAY, options: Options = {}) => {
  const random = vi.fn(() => value);
  const onChangeCourse = vi.fn();
  const onHome = vi.fn();
  const user = userEvent.setup();
  const view = render(practice(random, now, options, onChangeCourse, onHome));
  const switchTo = (next: Options) =>
    view.rerender(practice(random, now, { ...options, ...next }, onChangeCourse, onHome));
  return { user, random, onChangeCourse, onHome, switchTo, ...view };
};

const startButton = (name: string) => screen.getByRole("button", { name });
const start = async (
  user: ReturnType<typeof userEvent.setup>,
  name = "Start Letters a to e"
) => {
  await user.click(startButton(name));
  await passIntro(user);
};
/** New letters show their cards first; practising starts after them. */
const passIntro = async (user: ReturnType<typeof userEvent.setup>) => {
  const go = screen.queryByRole("button", { name: "Start practising" });
  if (go) await user.click(go);
};

const status = () => screen.getByRole("status");
const screenHeading = () => screen.getByRole("heading", { level: 2 });
const prompt = () => screen.getByRole("heading", { level: 3 });
/** How many of the lesson's letters are learnt, shown as a progress bar. */
const learnt = () => screen.getByRole("progressbar", { name: "Letters learnt" });
const term = (name: string) => screen.getByText(name).nextElementSibling;
/** One "Points" line until a second course has points, then the total. */
const points = () => term(screen.queryByText("Total points") ? "Total points" : "Points");
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
    expect(screen.getByText("0 of 9 lessons done.")).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "English lessons" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(9);
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
      "Numbers 1 to 5",
      "Numbers 6 to 0",
      "Full stop to apostrophe",
      "Hyphen to brackets",
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
    expect(screen.queryByText("Points")).not.toBeInTheDocument();
    expect(streak()).toHaveTextContent("2 days");
    expect(screen.getByText("Total points").closest("[aria-live], [role=status]")).toBeNull();
  });

  test("with points from one course only, shows one Points line", () => {
    save({
      points: 30,
      lastPlayed: "2026-11-11",
      streak: 1,
      bestStreak: 1,
      letters: { "english:a": { correct: 3, wrong: 0, box: 3 } },
    });
    setup();
    expect(term("Points")).toHaveTextContent("30");
    expect(screen.queryByText("Total points")).not.toBeInTheDocument();
    expect(screen.queryByText("English points")).not.toBeInTheDocument();
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
    expect(learnt()).toHaveAttribute("aria-valuetext", "0 of 5 letters learnt");
    expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
    // A new player taps the cell's dots.
    expect(
      screen.getByRole("group", { name: /braille cell/i })
    ).toHaveAccessibleDescription("Write the letter a in braille");
    expect(screen.queryByRole("application", { name: "Brailler keys" })).not.toBeInTheDocument();
    expect(status()).toHaveTextContent("");
    // Points and streak stay on the lesson list, away from the question.
    expect(screen.queryByText(/^(Total )?points$/i)).not.toBeInTheDocument();
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

    test("keyboard works from the first moment, with focus on the heading", async () => {
      const { user } = setupMode();
      await start(user);
      expect(screenHeading()).toHaveFocus();

      await user.keyboard("{f>}{/f}");
      expect(dotButton(dotEntry, 1)).toHaveAttribute("aria-pressed", "true");
      await user.keyboard("{Control>}2{/Control}");
      expect(dotButton(dotEntry, 2)).toHaveAttribute("aria-pressed", "false");
      await user.keyboard("{Enter}");
      expect(status()).toHaveTextContent("Correct, plus 10 points.");
    });

    test("keyboard: number keys raise dots, Enter checks and Enter moves on", async () => {
      const { user } = setupMode();
      await start(user);

      await user.keyboard("1");
      expect(dotButton(dotEntry, 1)).toHaveAttribute("aria-pressed", "true");
      await user.keyboard("{Enter}");

      expect(status()).toHaveTextContent(
        "Correct, plus 10 points. Dot 1 makes the letter a in English. " +
          "One more right answer for the letter a to learn it."
      );
      // A lone a or i is named as a letter, never left to read as a word.
      expect(status().textContent).not.toMatch(/(?<!letters?)\s[ai][\s.]/);
      // The progress shows the rule: a is halfway, nothing learnt yet.
      expect(learnt()).toHaveAttribute(
        "aria-valuetext",
        "0 of 5 letters learnt. The letter\u00a0a needs one more right answer."
      );
      // The sentence is spoken only; the sheet shows the points, which the
      // stamp and the pip don't.
      expect(status()).toHaveClass("sr-only");
      expect(screen.getByText("points")).toHaveTextContent("+10 points");
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
        "Not quite. Dot 1 makes the letter a in English. You raised dots 1 and 4."
      );
      expect(screen.getByText("Answer")).toBeInTheDocument();
      // Spoken only: the stamp, the pip and the compare cells show it all.
      expect(status()).toHaveClass("sr-only");
      expect(screen.queryByText(/points/)).not.toBeInTheDocument();
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
        "Correct, plus 10 points. Dots 1 and 2 make the letter b in English."
      );
      expect(saved().points).toBe(20);
    });

    test("Clear and Backspace empty the cell before checking", async () => {
      const { user } = setupMode();
      await start(user);
      const dot1 = dotButton(dotEntry, 1);

      await user.keyboard("12");
      await user.click(screen.getByRole("button", { name: "Clear dots" }));
      expect(dot1).toHaveAttribute("aria-pressed", "false");

      await user.keyboard("1{Backspace}");
      expect(dot1).toHaveAttribute("aria-pressed", "false");
    });
  });

  test("checking an empty cell asks for a dot instead of marking it wrong", async () => {
    const { user } = setup();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Raise at least one dot, then check your answer."
    );
    // A hint before the answer is shown as well as spoken.
    expect(status()).not.toHaveClass("sr-only");
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
      "Correct, plus 10 points. Dots 1 and 2 make the letter b in English."
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
      /^Write the letter b in braille On a keyboard, hold/
    );

    await user.keyboard("{f>}{d>}{/d}{/f}{Enter}");
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 2 make the letter b in English."
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
      "Correct, plus 10 points. Dots 1 and 4 make the letter c in English."
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
      new RegExp(`^Not quite\\. Dots 1 and 4 make the letter c in English\\. You chose the letter\\s${chosen}, which is`)
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
  expect(text).toMatch(
    /You chose the letter\se, which is dots 1 and 5\. Get the letter\sc right twice to learn it\.$/
  );
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
      "Correct, plus 10 points. Dots 1, 4 and 5 make the letter delta in Greek."
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
      "Not quite. Dot 1 makes the letter alpha in Greek. You raised dot 2."
    );
  });
});

describe("learning a letter", () => {
  test("the second right answer in a row says the letter is learnt", async () => {
    save({ letters: boxes("english", ["a"], 1) });
    const { user } = setup(0);
    await start(user);
    expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
    await user.keyboard("1{Enter}");
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dot 1 makes the letter a in English. The letter a is learnt now."
    );
    expect(learnt()).toHaveAttribute("aria-valuetext", "1 of 5 letters learnt");
  });

  test("a miss keeps the right answer already earned, and says so", async () => {
    save({ letters: boxes("english", ["a"], 1) });
    const { user } = setup(0);
    await start(user);
    expect(prompt()).toHaveAccessibleName("Write the letter a in braille");
    await user.keyboard("2{Enter}");

    expect(status()).toHaveTextContent(
      "Not quite. Dot 1 makes the letter a in English. You raised dot 2. " +
        "Your right answer still counts. Get the letter a right once more to learn it."
    );
    // The sheet shows a's pip still half raised, and the frame agrees.
    const note = screen.getByText(/Still one more for/);
    expect(note).toHaveTextContent("Still one more for a");
    expect(note.parentElement?.querySelector(".pip-dots")).toHaveAttribute(
      "data-state",
      "half"
    );
    expect(learnt()).toHaveAttribute(
      "aria-valuetext",
      "0 of 5 letters learnt. The letter a needs one more right answer."
    );
    expect(saved().letters["english:a"]).toEqual({ correct: 1, wrong: 1, box: 1 });
  });

  test("a first miss says the letter needs two right answers", async () => {
    const { user } = setup(0);
    await start(user);
    await user.keyboard("2{Enter}");
    expect(status()).toHaveTextContent(
      "You raised dot 2. Get the letter a right twice to learn it."
    );
    expect(screen.getByText(/Two more for/)).toHaveTextContent("Two more for a");
  });

  test("a learnt letter stays learnt after a miss", async () => {
    save({
      completedLessons: { english: ["a-e"] },
      letters: boxes("english", ["a", "b", "c", "d", "e"], 2),
    });
    const { user } = setup(0);
    await start(user, "Practise again Letters a to e");
    await user.keyboard("2{Enter}");
    expect(status()).toHaveTextContent("You raised dot 2. The letter a is still learnt.");
    expect(document.querySelector(".mastery-note")).toHaveTextContent("a still learnt");
    expect(learnt()).toHaveAttribute("aria-valuetext", "5 of 5 letters learnt");
  });

  test("learnt letters are not asked again, so the lesson ends when the last is learnt", async () => {
    save({ letters: { ...boxes("english", ["a", "b", "c", "d"], 2) } });
    const { user } = setup(0);
    await start(user, "Continue Letters a to e");
    // Only e is left: every question is about it, until it is learnt.
    expect(prompt()).toHaveAccessibleName("Write the letter e in braille");
    await user.keyboard("2{Enter}");
    await user.keyboard("{Enter}");
    expect(prompt()).toHaveAccessibleName("Write the letter e in braille");
    await user.keyboard("15{Enter}{Enter}");
    expect(prompt()).toHaveAccessibleName("Write the letter e in braille");
    await user.keyboard("15{Enter}");
    expect(status()).toHaveTextContent("Lesson done.");
    expect(screen.getByRole("button", { name: "Next lesson" })).toHaveFocus();
  });

  test("a lesson answered right every time takes two questions per letter", async () => {
    const dots: Record<string, string> = { a: "1", b: "12", c: "14", d: "145", e: "15" };
    const { user } = setup(0);
    await start(user);
    let asked = 0;
    while (!screen.queryByRole("button", { name: "Next lesson" }) && asked < 20) {
      const name = prompt().textContent ?? "";
      const letter = /Write the letter (\S) in braille/.exec(name)?.[1] ?? "";
      expect(dots[letter]).toBeDefined();
      asked++;
      await user.keyboard(`${dots[letter]}{Enter}`);
      if (!screen.queryByRole("button", { name: "Next lesson" })) {
        await user.keyboard("{Enter}");
      }
    }
    expect(asked).toBe(10);
    expect(learnt()).toHaveAttribute("aria-valuetext", "5 of 5 letters learnt");
  });
});

describe("lesson intro", () => {
  test("states the rule: right twice, and a miss takes nothing away", async () => {
    const { user } = setup();
    await user.click(startButton("Start Letters a to e"));
    expect(
      screen.getByText(
        "Look at each one first. Then get each letter right twice to finish the lesson. " +
          "A wrong answer never takes away a right one."
      )
    ).toBeInTheDocument();
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
    expect(learnt()).toHaveAttribute(
      "aria-valuetext",
      "4 of 5 letters learnt. The letter\u00a0e needs one more right answer."
    );

    await user.click(screen.getByRole("button", { name: "e" }));
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Dots 1 and 5 make the letter e in English. " +
        "Lesson done. You learnt the letters a, b, c, d and e in this lesson, and Letters f to j is now open. " +
        "You have 10 points."
    );
    // The lesson's letters land as cards, and the heading says what was learnt.
    expect(prompt()).toHaveAccessibleName("You learnt 5 new letters");
    expect(status().textContent).not.toMatch(/(^|\s)\p{L}\./u);
    expect(learnt()).toHaveAttribute("aria-valuetext", "5 of 5 letters learnt");
    expect(screen.getByRole("button", { name: "Next lesson" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Close lesson" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to lessons" })).toBeInTheDocument();
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
    expect(screen.getByText("1 of 9 lessons done.")).toBeInTheDocument();
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

    // The new letters are met on their cards first.
    expect(screenHeading()).toHaveAccessibleName("English: Letters f to j");
    expect(screenHeading()).toHaveFocus();
    expect(prompt()).toHaveTextContent("Meet the new cards");
    expect(screen.getByRole("status")).toHaveTextContent("Card 1 of 5: f, dots 1, 2 and 4.");
    await user.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByRole("status")).toHaveTextContent("Card 2 of 5: g");
    await user.click(screen.getByRole("button", { name: "Start practising" }));
    expect(screenHeading()).toHaveFocus();
    expect(status()).toHaveTextContent("");
    expect(learnt()).toHaveAttribute("aria-valuetext", "0 of 5 letters learnt");
  });

  test("Back to lessons puts focus on the lesson just finished", async () => {
    nearlyDone();
    const { user } = setup(0.5);
    await start(user, "Continue Letters a to e");
    await user.click(screen.getByRole("button", { name: "e" }));
    await user.click(screen.getByRole("button", { name: "Back to lessons" }));

    expect(screenHeading()).toHaveAccessibleName("English lessons");
    expect(startButton("Practise again Letters a to e")).toHaveFocus();
  });

  test("finishing the letters opens the numbers", async () => {
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
      "Lesson done. You learnt the letters u, v, w, x, y and z in this lesson, and Numbers 1 to 5 is now open."
    );
    expect(screen.getByRole("button", { name: "Next lesson" })).toHaveFocus();
  });

  test("the last lesson of a course ends with plain congratulations", async () => {
    save({
      completedLessons: {
        english: ["a-e", "f-j", "k-o", "p-t", "u-z", "numbers-1-5", "numbers-6-0", "punctuation-1"],
      },
      letters: {
        ...boxes("english", ["-", ":", ";", "–", "("], 4),
        ...boxes("english", [")"], 1),
      },
    });
    const { user } = setup(0.5);
    await start(user, "Continue Hyphen to brackets");
    expect(prompt()).toHaveAccessibleName(
      "Which sign has 2 cells, dot 5, then dots 3, 4 and 5?"
    );
    await user.click(screen.getByRole("button", { name: "closing bracket" }));

    expect(status()).toHaveTextContent(
      "Closing bracket is written with dot 5, then dots 3, 4 and 5, in English. " +
        "Lesson done. You learnt hyphen, colon, semicolon, dash, opening bracket and closing bracket in this lesson, the last one in the English course. " +
        "Congratulations, you have learnt everything it teaches."
    );
    expect(screen.queryByRole("button", { name: "Next lesson" })).not.toBeInTheDocument();
    const back = screen.getByRole("button", { name: "Back to lessons" });
    expect(back).toHaveFocus();

    await user.click(back);
    expect(screen.getByText("9 of 9 lessons done.")).toBeInTheDocument();
    expect(startButton("Practise again Hyphen to brackets")).toHaveFocus();
  });
});

describe("going back and replaying", () => {
  test("Closing a lesson focuses that lesson's button", async () => {
    const { user } = setup();
    await start(user);
    await user.click(screen.getByRole("button", { name: "Close lesson" }));
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
    expect(learnt()).toHaveAttribute("aria-valuetext", "0 of 10 letters learnt");
    // random() = 0.99 picks the last letter met: j, dots 2, 4 and 5.
    expect(prompt()).toHaveAccessibleName("Which letter has dots 2, 4 and 5?");

    await user.click(screen.getByRole("button", { name: "Close lesson" }));
    expect(
      screen.getByRole("button", { name: "Practise everything so far" })
    ).toHaveFocus();
  });
});

test("each course keeps its own lesson progress", () => {
  save({ completedLessons: { english: ["a-e"] } });
  const { switchTo } = setup();
  expect(screen.getByText("1 of 9 lessons done.")).toBeInTheDocument();

  switchTo({ language: "greek" });
  expect(screenHeading()).toHaveAccessibleName("Greek lessons");
  expect(screen.getByText("0 of 10 lessons done.")).toBeInTheDocument();
  expect(startButton("Start Alpha to zeta")).not.toHaveAttribute("aria-disabled");
  expect(startButton("Start Eta to mu")).toHaveAttribute("aria-disabled", "true");

  switchTo({ language: "english" });
  expect(screen.getByText("1 of 9 lessons done.")).toBeInTheDocument();
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
  // a is learnt already, so the lesson starts on b (dots 1 and 2).
  expect(prompt()).toHaveAccessibleName("Write the letter b in braille");
  await user.keyboard("12{Enter}");
  // Totals are shown on the lesson list, not announced.
  expect(status()).not.toHaveTextContent(/50|4 days/);
  await user.click(screen.getByRole("button", { name: "Close lesson" }));
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

  await user.click(screen.getByRole("button", { name: "Close lesson" }));
  expect(screenHeading()).toHaveAccessibleName("English lessons");
  expect(points()).toHaveTextContent("10");
});

test("passes its random source to the review picker", async () => {
  const { user, random } = setup();
  expect(random).not.toHaveBeenCalled();
  await start(user);
  expect(random).toHaveBeenCalled();
});

describe("numbers and punctuation: signs of several cells", () => {
  const LETTER_LESSONS = ["a-e", "f-j", "k-o", "p-t", "u-z"];
  const cellButton = (name: RegExp) =>
    within(screen.getByRole("group", { name: "Cells of your answer" })).getByRole(
      "button",
      { name }
    );

  test("letter lessons show no cell counter and no Next cell button", async () => {
    const { user } = setup();
    await start(user);
    expect(screen.queryByText(/^Cell 1 of/)).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Cells of your answer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next cell" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous cell" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
  });

  test("the numbers open after the letters, named for screen readers", () => {
    save({ completedLessons: { english: LETTER_LESSONS } });
    setup();
    const lesson = startButton("Start Numbers 1 to 5");
    expect(lesson).not.toHaveAttribute("aria-disabled");
    expect(lesson).toHaveAccessibleDescription("Next. 0 of 5 numbers learnt.");
    expect(
      screen.getAllByRole("listitem")[5].querySelector(".lesson-letters")
    ).toHaveTextContent(/number 1.*number 5/);
  });

  test("write a number cell by cell: number sign, then the digit", async () => {
    save({ completedLessons: { english: LETTER_LESSONS } });
    const { user } = setup();
    await start(user, "Start Numbers 1 to 5");

    const bar = screen.getByRole("progressbar", { name: "Numbers learnt" });
    expect(bar).toHaveAttribute("aria-valuetext", "0 of 5 numbers learnt");
    expect(prompt()).toHaveAccessibleName("Write number 1 in braille");
    expect(screen.getByText("Cell 1 of 2")).toBeVisible();
    // The dots say which cell they write.
    expect(
      screen.getByRole("group", { name: /braille cell/i })
    ).toHaveAccessibleDescription("Write number 1 in braille Cell 1 of 2");
    expect(cellButton(/^Cell 1 of 2/)).toHaveAttribute("aria-current", "true");

    // An empty cell can't be skipped.
    await user.click(screen.getByRole("button", { name: "Next cell" }));
    expect(status()).toHaveTextContent("Raise at least one dot in cell 1 first.");

    for (const dot of [3, 4, 5, 6]) await user.click(dotButton("cell", dot));
    await user.click(screen.getByRole("button", { name: "Next cell" }));
    expect(status()).toHaveTextContent("Cell 2 of 2, no dots raised.");
    expect(screen.getByText("Cell 2 of 2")).toBeVisible();
    expect(cellButton(/^Cell 1 of 2, dots 3, 4, 5 and 6$/)).not.toHaveAttribute("aria-current");
    expect(cellButton(/^Cell 2 of 2, no dots$/)).toHaveAttribute("aria-current", "true");
    expect(dotButton("cell", 3)).toHaveAttribute("aria-pressed", "false");

    // Back to cell 1 keeps what was written there.
    await user.click(screen.getByRole("button", { name: "Previous cell" }));
    expect(status()).toHaveTextContent("Cell 1 of 2, dots 3, 4, 5 and 6 raised.");
    expect(dotButton("cell", 6)).toHaveAttribute("aria-pressed", "true");
    await user.click(cellButton(/^Cell 2 of 2/));
    expect(screen.queryByRole("button", { name: "Next cell" })).not.toBeInTheDocument();

    await user.click(dotButton("cell", 1));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Number 1 is written with dots 3, 4, 5 and 6, then dot 1, in English."
    );
    expect(saved().letters["english:1"]).toEqual({ correct: 1, wrong: 0, box: 1 });
    expect(screen.queryByRole("group", { name: "Cells of your answer" })).not.toBeInTheDocument();
  });

  test("keyboard: Enter moves to the next cell, then checks", async () => {
    save({ completedLessons: { english: LETTER_LESSONS } });
    const { user } = setup();
    await start(user, "Start Numbers 1 to 5");

    await user.keyboard("3456");
    await user.keyboard("{Enter}");
    expect(screen.getByText("Cell 2 of 2")).toBeVisible();
    // Forgot the number sign's partner: the digit 2 is dots 1 and 2.
    await user.keyboard("2");
    await user.keyboard("{Enter}");
    expect(status()).toHaveTextContent(
      "Not quite. Number 1 is written with dots 3, 4, 5 and 6, then dot 1, in English. " +
        "You raised dots 3, 4, 5 and 6, then dot 2."
    );
    expect(screen.getByRole("button", { name: "Next question" })).toHaveFocus();
    expect(saved().letters["english:1"]).toEqual({ correct: 0, wrong: 1, box: 0 });
  });

  test("checking with an empty cell goes to that cell", async () => {
    save({ completedLessons: { english: LETTER_LESSONS } });
    const { user } = setup();
    await start(user, "Start Numbers 1 to 5");
    await user.click(cellButton(/^Cell 2 of 2/));
    await user.click(dotButton("cell", 1));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent(
      "Raise at least one dot in cell 1, then check your answer."
    );
    expect(screen.getByText("Cell 1 of 2")).toBeVisible();
  });

  test("dots to sign: every cell is described, choices are named", async () => {
    save({ completedLessons: { english: LETTER_LESSONS } });
    const { user } = setup(0.5);
    await start(user, "Start Numbers 1 to 5");
    // random() = 0.5 asks about 3: number sign, then c.
    expect(prompt()).toHaveAccessibleName(
      "Which sign has 2 cells, dots 3, 4, 5 and 6, then dots 1 and 4?"
    );
    const choices = within(screen.getByRole("group", { name: /^Which sign/ }));
    await user.click(choices.getByRole("button", { name: "number 3" }));
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Number 3 is written with dots 3, 4, 5 and 6, then dots 1 and 4, in English."
    );
  });

  test("Greek punctuation: the question mark is ; in print", async () => {
    save({
      completedLessons: {
        greek: ["alpha-zeta", "eta-mu", "nu-sigma", "tau-omega", "pairs-1", "pairs-2", "numbers-1-5", "numbers-6-0"],
      },
      letters: boxes("greek", [".", ",", "!", "’"], 4),
    });
    // random() = 0.5 asks which sign has the question mark's dots.
    const { user } = setup(0.5, undefined, { language: "greek" });
    await start(user, "Continue Full stop to apostrophe");
    expect(screen.getByRole("progressbar", { name: "Signs learnt" })).toBeInTheDocument();
    expect(prompt()).toHaveAccessibleName("Which sign has dots 2 and 6?");
    const choices = within(screen.getByRole("group", { name: /^Which sign/ }));
    const mark = choices.getByRole("button", { name: "question mark" });
    expect(within(mark).getByText(";")).toHaveAttribute("lang", "el");
    await user.click(mark);
    expect(status()).toHaveTextContent(
      "Correct, plus 10 points. Question mark is written with dots 2 and 6, in Greek."
    );
  });
});
