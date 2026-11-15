import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { getCourse } from "../../courses";
import {
  hintText,
  letterMarks,
  puzzleForDay,
  shareMessage,
  spellWord,
  wordCells,
} from "../../daily/daily";
import { loadDaily } from "../../daily/storage";
import { Language, raisedDots } from "../../game/braille";
import { emptyProgress, Progress } from "../../game/progress";
import type { DotEntry } from "../../game/settings";
import { Daily } from "./Daily";

const DAY = new Date(2026, 10, 15, 12);
const now = () => DAY;
const english = puzzleForDay("english", "2026-11-15")!;

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

type Options = { language?: Language; dotEntry?: DotEntry; onProgress?: (next: Progress) => void };

const Harness = ({ language = "english", dotEntry = "cell", onProgress }: Options) => {
  const [progress, setProgress] = React.useState(emptyProgress);
  return (
    <Daily
      course={getCourse(language)}
      dotEntry={dotEntry}
      showKeyLetters
      keyShortcuts
      progress={progress}
      onProgress={(next) => {
        setProgress(next);
        onProgress?.(next);
      }}
      onBack={() => {}}
      now={now}
    />
  );
};

const open = (options: Options = {}) => {
  const user = userEvent.setup();
  const view = render(<Harness {...options} />);
  return { user, ...view };
};

/** The word with one letter changed, so the rest are still right. */
const misspell = (word: string, at: number, by = "q") => {
  const letters = [...word];
  letters[at] = letters[at] === by ? "z" : by;
  return letters.join("");
};

const input = () => screen.getByRole("textbox", { name: "Type the word in print" });
const status = () => screen.getByRole("status");

const typeWord = async (user: ReturnType<typeof userEvent.setup>, word: string) => {
  await user.clear(input());
  await user.type(input(), word);
  await user.click(screen.getByRole("button", { name: "Check" }));
};

const dotsOf = (word: string, language: Language = "english") =>
  wordCells(word, language).map(raisedDots);

/** Writes cells by clicking: each cell's button, Clear dots, then its dots. */
const writeCells = async (user: ReturnType<typeof userEvent.setup>, cells: number[][]) => {
  for (const [index, dots] of cells.entries()) {
    await user.click(
      screen.getByRole("button", { name: new RegExp(`^Cell ${index + 1} of ${cells.length},`) })
    );
    await user.click(screen.getByRole("button", { name: "Clear dots" }));
    for (const dot of dots) {
      await user.click(screen.getByRole("button", { name: new RegExp(`^Dot ${dot}\\b`) }));
    }
  }
  await user.click(screen.getByRole("button", { name: "Check word" }));
};

const finishRead = async (user: ReturnType<typeof userEvent.setup>) => {
  await typeWord(user, english.read);
  await user.click(screen.getByRole("button", { name: "Go on to Write it" }));
};

describe("Read it", () => {
  test("opens with focus on the heading and shows the word as cells, said in words", () => {
    open();
    expect(screen.getByRole("heading", { level: 2, name: "Daily puzzle" })).toHaveFocus();
    expect(screen.getByText("English · 15 Nov 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Read it" })).toBeInTheDocument();
    expect(screen.getByText("Part 1 of 2 · try 1 of 3")).toBeInTheDocument();
    const words = screen.getByRole("list", { name: "The cells in words" });
    const cells = dotsOf(english.read);
    expect(within(words).getAllByRole("listitem")).toHaveLength(cells.length);
    expect(within(words).getAllByRole("listitem")[0]).toHaveTextContent(/^Cell 1: dots? /);
    // The cells themselves are hidden; the list says them.
    expect(document.querySelector(".cell-row")).toHaveAttribute("aria-hidden", "true");
  });

  test("the right word on the first try", async () => {
    const { user } = open();
    await typeWord(user, english.read.toUpperCase());
    expect(status()).toHaveTextContent(
      `Yes! The word is ${english.read} (${spellWord(english.read, "english")}).`
    );
    expect(screen.getByRole("button", { name: "Go on to Write it" })).toHaveFocus();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(loadDaily("2026-11-15", "english").read).toEqual([english.read]);
  });

  test("a wrong try says which letters are right and keeps the word to edit", async () => {
    const { user } = open();
    const guess = misspell(english.read, 1);
    await typeWord(user, guess);
    const hint = hintText(letterMarks(guess, english.read), guess.length);
    expect(status()).toHaveTextContent(`Not quite. ${hint} Two more tries.`);
    expect(input()).toHaveValue(guess);
    expect(screen.getByText("Part 1 of 2 · try 2 of 3")).toBeInTheDocument();
    const tries = screen.getByRole("list", { name: "Your tries" });
    expect(within(tries).getByRole("listitem")).toHaveTextContent(`${guess}. ${hint}`);
    // Shape and mark, not only colour.
    expect(tries.querySelectorAll('[data-mark="right"]')).toHaveLength(english.read.length - 1);
    expect(tries.querySelector('[data-mark="other"]')).toHaveTextContent("·");
  });

  test("the same word twice is not counted, and an empty one asks for a word", async () => {
    const { user } = open();
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(status()).toHaveTextContent("Type the word first, then check it.");
    await typeWord(user, "zzz");
    await typeWord(user, "zzz");
    expect(status()).toHaveTextContent("You tried that word already.");
    expect(loadDaily("2026-11-15", "english").read).toEqual(["zzz"]);
  });

  test("three misses show the answer", async () => {
    const { user } = open();
    await typeWord(user, "zzz");
    await typeWord(user, "zzzz");
    expect(status()).toHaveTextContent("One more try.");
    await typeWord(user, "zzzzz");
    expect(status()).toHaveTextContent(
      `Not this time. The word is ${english.read} (${spellWord(english.read, "english")}).`
    );
    expect(screen.getByText(/The word is/, { selector: ".daily-answer" })).toHaveTextContent(
      english.read
    );
    expect(screen.getByRole("button", { name: "Go on to Write it" })).toHaveFocus();
  });
});

describe("Write it", () => {
  test("shows the word in print, letter by letter, with focus on its heading", async () => {
    const { user } = open();
    await finishRead(user);
    expect(screen.getByRole("heading", { level: 3, name: "Write it" })).toHaveFocus();
    const letters = [...english.write];
    expect(screen.getByText(`Letter 1 of ${letters.length}:`, { exact: false })).toHaveTextContent(
      `Letter 1 of ${letters.length}: ${letters[0]}`
    );
    expect(screen.getByRole("group", { name: "Letters of your answer" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /braille cell/i })).toBeInTheDocument();
    expect(screen.getByRole("application", { name: "Braille keyboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dot 1" }));
    await user.click(screen.getByRole("button", { name: "Next letter" }));
    expect(status()).toHaveTextContent(`Letter 2 of ${letters.length}, ${letters[1]}: no dots raised.`);
    await user.click(screen.getByRole("button", { name: "Previous letter" }));
    expect(status()).toHaveTextContent(`Letter 1 of ${letters.length}, ${letters[0]}: dot 1 raised.`);
  });

  test("the right word finishes the puzzle and gives points and the streak", async () => {
    const onProgress = vi.fn();
    const { user } = open({ onProgress });
    await finishRead(user);
    await writeCells(user, dotsOf(english.write));
    expect(status()).toHaveTextContent(`Yes! You wrote ${english.write}`);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress.mock.calls[0][0]).toMatchObject({ points: 50, streak: 1, lastPlayed: "2026-11-15" });
    await user.click(screen.getByRole("button", { name: "See today's result" }));
    expect(screen.getByRole("heading", { level: 3, name: "Today's result" })).toHaveFocus();
    expect(
      screen.getByText("Braille Buddy daily, 15 Nov 2026 (English): Read it in 1 try, Write it in 1 try.")
    ).toBeInTheDocument();
    expect(screen.getByText("+50 pts today · 50 pts in all · day 1")).toBeInTheDocument();
    expect(document.querySelector(".daily-grid")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector(".daily-grid")).toHaveTextContent("Read ⠿");
  });

  test("a wrong try says which letters are right and goes to the first wrong one", async () => {
    const { user } = open();
    await finishRead(user);
    const cells = dotsOf(english.write);
    const wrong = cells.map((dots, index) => (index === 1 ? (dots.join() === "6" ? [5] : [6]) : dots));
    await writeCells(user, wrong);
    const marks = cells.map((_, index) => index !== 1);
    expect(status()).toHaveTextContent(`Not quite. ${hintText(marks)} Two more tries.`);
    expect(screen.getByText(`Letter 2 of ${cells.length}:`, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Your tries" })).toHaveTextContent(hintText(marks));
    // The same cells again are not counted.
    await user.click(screen.getByRole("button", { name: new RegExp(`^Cell ${cells.length} of`) }));
    await user.click(screen.getByRole("button", { name: "Check word" }));
    expect(status()).toHaveTextContent("You tried those cells already.");
  });

  test("three misses show the answer in cells and in words", async () => {
    const onProgress = vi.fn();
    const { user } = open({ onProgress });
    await finishRead(user);
    const count = [...english.write].length;
    for (const dot of [[6], [5], [4, 6]]) {
      await writeCells(user, Array.from({ length: count }, () => dot));
    }
    expect(status()).toHaveTextContent(`Not this time. In braille, ${english.write}`);
    expect(screen.getByText(/in braille:/, { selector: ".daily-answer p" })).toBeInTheDocument();
    // Finishing counts, even without the word: points for playing and the read word.
    expect(onProgress.mock.calls[0][0]).toMatchObject({ points: 30, streak: 1 });
    await user.click(screen.getByRole("button", { name: "See today's result" }));
    expect(screen.getByText(/Write it: answer shown after 3 tries\./)).toBeInTheDocument();
    expect(document.querySelector(".daily-grid")).toHaveTextContent("Write ⠤⠤⠤");
  });

  test("works from the keyboard alone: number keys and Enter", async () => {
    const { user } = open();
    await finishRead(user);
    for (const dots of dotsOf(english.write)) {
      await user.keyboard(dots.join(""));
      await user.keyboard("{Enter}");
    }
    expect(status()).toHaveTextContent(`Yes! You wrote ${english.write}`);
  });

  test("brailler keys when the player chose them", async () => {
    const { user } = open({ dotEntry: "keys" });
    await finishRead(user);
    expect(screen.getByRole("application", { name: "Brailler keys" })).toBeInTheDocument();
    await writeCells(user, dotsOf(english.write));
    expect(status()).toHaveTextContent("Yes!");
  });
});

describe("the result", () => {
  const finish = async (user: ReturnType<typeof userEvent.setup>) => {
    await finishRead(user);
    await writeCells(user, dotsOf(english.write));
    await user.click(screen.getByRole("button", { name: "See today's result" }));
  };
  const message = shareMessage(english, "English", [true], [true]);

  test("Share copies the result when there is no share sheet", async () => {
    const { user } = open();
    await finish(user);
    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(await screen.findByText("Result copied. Paste it anywhere to share it.")).toHaveAttribute(
      "role",
      "status"
    );
    expect(await navigator.clipboard.readText()).toBe(message);
    expect(message).toContain("https://braille-buddy.krispytech.workers.dev/");
  });

  test("Share uses the share sheet where there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    try {
      const { user } = open();
      await finish(user);
      await user.click(screen.getByRole("button", { name: "Share result" }));
      expect(await screen.findByText("Result shared.")).toBeInTheDocument();
      expect(share).toHaveBeenCalledWith({ text: message });
    } finally {
      delete (navigator as { share?: unknown }).share;
    }
  });

  test("reopening shows the finished result and gives no points again", async () => {
    const first = open();
    await finish(first.user);
    first.unmount();
    const onProgress = vi.fn();
    open({ onProgress });
    expect(screen.getByRole("heading", { level: 3, name: "Today's result" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Daily puzzle" })).toHaveFocus();
    expect(onProgress).not.toHaveBeenCalled();
  });

  test("reopening halfway carries on with Write it", async () => {
    const first = open();
    await typeWord(first.user, english.read);
    first.unmount();
    open();
    expect(screen.getByRole("heading", { level: 3, name: "Write it" })).toBeInTheDocument();
  });
});

describe("Greek", () => {
  const greek = puzzleForDay("greek", "2026-11-15")!;

  test("follows the course: Greek words, typed with or without accents", async () => {
    const { user } = open({ language: "greek" });
    expect(screen.getByText("Greek · 15 Nov 2026")).toBeInTheDocument();
    expect(input()).toHaveAttribute("lang", "el");
    // An accent on the first vowel, as a player might type it.
    const accented = greek.read.replace(/[αεηιουω]/, (vowel) => `${vowel}́`).normalize("NFC");
    await typeWord(user, accented);
    expect(status()).toHaveTextContent(`Yes! The word is ${greek.read} (${spellWord(greek.read, "greek")}).`);
    await user.click(screen.getByRole("button", { name: "Go on to Write it" }));
    expect(screen.getByText(greek.write, { selector: ".daily-word" })).toHaveAttribute("lang", "el");
    await writeCells(user, dotsOf(greek.write, "greek"));
    expect(status()).toHaveTextContent("Yes!");
  });
});
