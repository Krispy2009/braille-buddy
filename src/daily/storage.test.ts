import { cellsToGuess, puzzleForDay, wordCells } from "./daily";
import { dailyStatus, emptyRecord, loadDaily, saveDaily } from "./storage";

const KEY = "braille-buddy:daily";

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

const record = { read: ["cot"], write: ["100000 100000 100000"], rewarded: false };

test("a saved record comes back for its day and course only", () => {
  const storage = memoryStorage();
  expect(saveDaily("2026-11-15", "english", record, storage)).toBe(true);
  expect(loadDaily("2026-11-15", "english", storage)).toEqual(record);
  expect(loadDaily("2026-11-15", "greek", storage)).toEqual(emptyRecord());
  expect(loadDaily("2026-11-16", "english", storage)).toEqual(emptyRecord());
});

test("each course keeps its own record on the same day", () => {
  const storage = memoryStorage();
  saveDaily("2026-11-15", "english", record, storage);
  saveDaily("2026-11-15", "greek", { ...record, read: ["γατα"] }, storage);
  expect(loadDaily("2026-11-15", "english", storage).read).toEqual(["cot"]);
  expect(loadDaily("2026-11-15", "greek", storage).read).toEqual(["γατα"]);
});

test("a new day replaces the old one, so only one day is kept", () => {
  const storage = memoryStorage();
  saveDaily("2026-11-15", "english", record, storage);
  saveDaily("2026-11-16", "greek", record, storage);
  const saved = JSON.parse(storage.data.get(KEY)!);
  expect(saved.day).toBe("2026-11-16");
  expect(Object.keys(saved.courses)).toEqual(["greek"]);
});

test("never touches saved progress", () => {
  const progress = '{"version":1,"points":5}';
  const storage = memoryStorage({ "braille-buddy:progress": progress });
  saveDaily("2026-11-15", "english", record, storage);
  expect(storage.data.get("braille-buddy:progress")).toBe(progress);
});

test.each([
  ["not JSON", "{"],
  ["another version", JSON.stringify({ version: 2, day: "2026-11-15", courses: { english: record } })],
  ["too many tries", JSON.stringify({ version: 1, day: "2026-11-15", courses: { english: { ...record, read: ["a", "b", "c", "d"] } } })],
  ["a broken cell", JSON.stringify({ version: 1, day: "2026-11-15", courses: { english: { ...record, write: ["12"] } } })],
  ["no rewarded flag", JSON.stringify({ version: 1, day: "2026-11-15", courses: { english: { read: [], write: [] } } })],
])("broken saved data (%s) loads as a fresh puzzle", (_, raw) => {
  expect(loadDaily("2026-11-15", "english", memoryStorage({ [KEY]: raw }))).toEqual(emptyRecord());
});

test("storage errors are swallowed", () => {
  const broken = {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => {
      throw new Error("full");
    },
  };
  expect(loadDaily("2026-11-15", "english", broken)).toEqual(emptyRecord());
  expect(saveDaily("2026-11-15", "english", record, broken)).toBe(false);
});

describe("dailyStatus for Home", () => {
  const now = new Date(2026, 10, 15, 9);
  const puzzle = puzzleForDay("english", "2026-11-15")!;
  const written = cellsToGuess(wordCells(puzzle.write, "english"));

  test("not started, started, then done with the result", () => {
    const storage = memoryStorage();
    expect(dailyStatus("english", now, storage)).toEqual({ done: false, started: false, result: undefined });
    saveDaily("2026-11-15", "english", { read: [puzzle.read], write: [], rewarded: false }, storage);
    expect(dailyStatus("english", now, storage)).toEqual({ done: false, started: true, result: undefined });
    saveDaily(
      "2026-11-15",
      "english",
      { read: [puzzle.read], write: ["100000 100000 100000", written], rewarded: true },
      storage
    );
    expect(dailyStatus("english", now, storage)).toEqual({
      done: true,
      started: false,
      result: "Read it in 1 try, Write it in 2 tries",
    });
    // The next day is a new puzzle.
    expect(dailyStatus("english", new Date(2026, 10, 16, 0, 0), storage)?.done).toBe(false);
  });

  test("a course without a word list has no status", () => {
    expect(dailyStatus("klingon", now, memoryStorage())).toBeUndefined();
  });
});
