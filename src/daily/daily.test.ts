import { getCourse } from "../courses";
import { cellsForLetter, kindOfLetter } from "../game/braille";
import { dotsToCell } from "../game/cells";
import { dayKey } from "../game/progress";
import {
  attemptsFor,
  cellMarks,
  cellsToGuess,
  dailyPoints,
  dailyPuzzle,
  formatDay,
  gridRow,
  halfResult,
  hintText,
  letterMarks,
  normaliseGuess,
  ONE_CELL_PAIRS,
  puzzleForDay,
  resultText,
  shareGrid,
  shareMessage,
  shareSummary,
  SITE_URL,
  spellWord,
  triesLeftText,
  WORD_LISTS,
  wordCells,
} from "./daily";

/** Every local day from a start, as "YYYY-MM-DD". */
const days = (from: Date, count: number) =>
  Array.from({ length: count }, (_, index) =>
    dayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + index, 12))
  );

describe("word lists", () => {
  test.each(Object.keys(WORD_LISTS))("%s has 100+ distinct words of 3 to 5 letters", (id) => {
    const words = WORD_LISTS[id];
    expect(words.length).toBeGreaterThanOrEqual(100);
    expect(new Set(words).size).toBe(words.length);
    for (const word of words) {
      expect([...word].length).toBeGreaterThanOrEqual(3);
      expect([...word].length).toBeLessThanOrEqual(5);
    }
  });

  test.each(Object.keys(WORD_LISTS))("%s words use only the course's one-cell letters", (id) => {
    for (const word of WORD_LISTS[id]) {
      for (const letter of word) {
        expect(kindOfLetter(letter, id), `${word}: ${letter}`).toBe("letter");
        expect(cellsForLetter(letter, id), `${word}: ${letter}`).toHaveLength(1);
      }
      expect(word).toBe(word.toLocaleLowerCase());
    }
  });

  test("Greek words have no accents, no final sigma and no one-cell letter pairs", () => {
    const greek = getCourse("greek");
    const pairs = greek.letters.filter((entry) => [...entry.letter].length > 1 && !entry.kind);
    // The pairs the list avoids are exactly the course's one-cell pairs.
    expect(pairs.map((entry) => entry.letter).sort()).toEqual([...ONE_CELL_PAIRS].sort());
    for (const word of WORD_LISTS.greek) {
      expect(word.normalize("NFD")).toBe(word);
      expect(word.endsWith("σ")).toBe(false);
      for (const pair of ONE_CELL_PAIRS) expect(word).not.toContain(pair);
    }
  });
});

describe("picking the puzzle", () => {
  test("the same day gives the same puzzle", () => {
    expect(puzzleForDay("english", "2026-11-15")).toEqual(puzzleForDay("english", "2026-11-15"));
    expect(dailyPuzzle("greek", new Date(2026, 10, 15, 0, 0, 1))).toEqual(
      dailyPuzzle("greek", new Date(2026, 10, 15, 23, 59, 59))
    );
  });

  test("a new puzzle starts at local midnight", () => {
    const before = dailyPuzzle("english", new Date(2026, 10, 15, 23, 59, 59, 999))!;
    const after = dailyPuzzle("english", new Date(2026, 10, 16, 0, 0, 0, 0))!;
    expect(before.day).toBe("2026-11-15");
    expect(after.day).toBe("2026-11-16");
    expect([after.read, after.write]).not.toEqual([before.read, before.write]);
  });

  test("the two words differ and come from the course's list", () => {
    for (const course of Object.keys(WORD_LISTS)) {
      for (const day of days(new Date(2026, 0, 1), 400)) {
        const puzzle = puzzleForDay(course, day)!;
        expect(puzzle.read).not.toBe(puzzle.write);
        expect(WORD_LISTS[course]).toContain(puzzle.read);
        expect(WORD_LISTS[course]).toContain(puzzle.write);
      }
    }
  });

  test("days vary, and no word comes back for months", () => {
    for (const course of Object.keys(WORD_LISTS)) {
      const span = Math.floor((WORD_LISTS[course].length - 10) / 2) - 1;
      expect(span).toBeGreaterThanOrEqual(60);
      // Windows starting on every day for two years, across passes.
      const all = days(new Date(2026, 0, 1), 730 + span).map((day) => puzzleForDay(course, day)!);
      for (let start = 0; start < 730; start += 1) {
        const words = all.slice(start, start + span).flatMap((puzzle) => [puzzle.read, puzzle.write]);
        expect(new Set(words).size, `${course} from day ${start}`).toBe(words.length);
      }
    }
  });

  test("the pairs change from one pass through the list to the next", () => {
    // Two years is over six passes: fixed pairs would give only about 110.
    const puzzles = days(new Date(2026, 0, 1), 730).map((day) => puzzleForDay("english", day)!);
    const pairs = new Set(puzzles.map((puzzle) => [puzzle.read, puzzle.write].sort().join(" ")));
    expect(pairs.size).toBeGreaterThan(400);
  });

  test("the English and Greek puzzles are independent", () => {
    expect(puzzleForDay("english", "2026-11-15")!.course).toBe("english");
    expect(puzzleForDay("greek", "2026-11-15")!.course).toBe("greek");
  });

  test("a course without a word list has no puzzle", () => {
    expect(puzzleForDay("klingon", "2026-11-15")).toBeUndefined();
  });
});

describe("checking answers", () => {
  test("typed words are compared without case, spaces or accents", () => {
    expect(normaliseGuess("  Cat ")).toBe("cat");
    expect(normaliseGuess("Γάτα")).toBe("γατα");
    expect(normaliseGuess("ΡΟΖ")).toBe("ροζ");
    expect(normaliseGuess("χιονισ")).toBe("χιονισ");
    expect(normaliseGuess("χιονις")).toBe("χιονισ");
  });

  test("letter marks say which places are right", () => {
    expect(letterMarks("cot", "cat")).toEqual([true, false, true]);
    expect(letterMarks("ca", "cat")).toEqual([true, true, false]);
    expect(letterMarks("cats", "cat")).toEqual([true, true, true]);
  });

  test("cell marks compare each written cell", () => {
    const right = wordCells("cat", "english");
    const guess = cellsToGuess([right[0], dotsToCell([1, 2]), right[2]]);
    expect(guess).toBe("100100 110000 011110");
    expect(cellMarks(guess, "cat", "english")).toEqual([true, false, true]);
  });

  test("hints are gentle and say the places in words", () => {
    expect(hintText([true, false, true])).toBe("Letters 1 and 3 are right.");
    expect(hintText([false, true, false])).toBe("Letter 2 is right.");
    expect(hintText([false, false, false])).toBe("No letters are in the right place yet.");
    expect(hintText([true, true, true, false, false], 4)).toBe(
      "Letters 1, 2 and 3 are right. The word has 5 letters."
    );
    expect(triesLeftText(1)).toBe("Two more tries.");
    expect(triesLeftText(2)).toBe("One more try.");
  });

  test("words are spelled by letter name for screen readers", () => {
    expect(spellWord("cat", "english")).toBe("c, a, t");
    expect(spellWord("γατα", "greek")).toBe("gamma, alpha, tau, alpha");
  });

  test("a half is finished when solved or after three tries", () => {
    expect(halfResult([])).toEqual({ tries: 0, solved: false, finished: false });
    expect(halfResult([false, true])).toEqual({ tries: 2, solved: true, finished: true });
    expect(halfResult([false, false])).toEqual({ tries: 2, solved: false, finished: false });
    expect(halfResult([false, false, false])).toEqual({ tries: 3, solved: false, finished: true });
  });

  test("attempts are worked out from the saved tries", () => {
    const puzzle = { day: "2026-11-15", course: "english", read: "cat", write: "dog" };
    const dog = cellsToGuess(wordCells("dog", "english"));
    expect(attemptsFor(puzzle, { read: ["cot", "cat"], write: ["100000 100000 100000", dog] })).toEqual({
      read: [false, true],
      write: [false, true],
    });
  });

  test("points: some for finishing, more for each word got", () => {
    const got = halfResult([true]);
    const missed = halfResult([false, false, false]);
    expect(dailyPoints(got, got)).toBe(50);
    expect(dailyPoints(got, missed)).toBe(30);
    expect(dailyPoints(missed, missed)).toBe(10);
  });
});

describe("the result", () => {
  const puzzle = { day: "2026-11-15", course: "english", read: "cat", write: "dog" };

  test("dates read the same everywhere", () => {
    expect(formatDay("2026-11-15")).toBe("15 Nov 2026");
    expect(formatDay("2027-01-03")).toBe("3 Jan 2027");
  });

  test("the grid has a braille cell per try: ⠿ right, ⠤ missed, blank unused", () => {
    expect(gridRow([true])).toBe("⠿⠀⠀");
    expect(gridRow([false, true])).toBe("⠤⠿⠀");
    expect(gridRow([false, false, false])).toBe("⠤⠤⠤");
    expect(shareGrid([true], [false, true])).toBe("Read  ⠿⠀⠀\nWrite ⠤⠿⠀");
    for (const char of shareGrid([true], [false, false, false]).replace(/[^⠀-⣿]/g, "")) {
      expect(char.codePointAt(0)).toBeGreaterThanOrEqual(0x2800);
      expect(char.codePointAt(0)).toBeLessThanOrEqual(0x28ff);
    }
  });

  test("the summary reads well aloud", () => {
    expect(shareSummary(puzzle, "English", [true], [false, true])).toBe(
      "Braille Buddy daily, 15 Nov 2026 (English): Read it in 1 try, Write it in 2 tries."
    );
    expect(resultText(halfResult([false, false, false]), halfResult([true]))).toBe(
      "Read it: answer shown after 3 tries, Write it in 1 try"
    );
  });

  test("the message has the summary, the grid and the link, and no words", () => {
    const message = shareMessage(puzzle, "English", [true], [false, true]);
    expect(message.split("\n")).toEqual([
      "Braille Buddy daily, 15 Nov 2026 (English): Read it in 1 try, Write it in 2 tries.",
      "Read  ⠿⠀⠀",
      "Write ⠤⠿⠀",
      SITE_URL,
    ]);
    expect(message).not.toMatch(/\bcat\b|\bdog\b/);
  });
});
