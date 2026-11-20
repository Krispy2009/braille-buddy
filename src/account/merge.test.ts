import { cellsToGuess, puzzleForDay, wordCells } from "../daily/daily";
import type { DailyRecord, DailyState } from "../daily/storage";
import { emptyProgress, Progress } from "../game/progress";
import { mergeDaily, mergeProgress, mergeSnapshots, sameSnapshot, Snapshot } from "./merge";

const progress = (overrides: Partial<Progress> = {}): Progress => ({
  ...emptyProgress(),
  ...overrides,
});

const phone = progress({
  points: 120,
  streak: 3,
  bestStreak: 5,
  lastPlayed: "2026-11-14",
  letters: {
    "english:a": { correct: 5, wrong: 1, box: 3 },
    "english:b": { correct: 1, wrong: 0, box: 1 },
  },
  completedLessons: { english: ["a-e"] },
});

const laptop = progress({
  points: 90,
  streak: 1,
  bestStreak: 2,
  lastPlayed: "2026-11-15",
  letters: {
    "english:a": { correct: 2, wrong: 0, box: 2 },
    "english:c": { correct: 3, wrong: 3, box: 0 },
  },
  completedLessons: { english: ["f-j", "a-e"], greek: ["alpha"] },
});

describe("mergeProgress", () => {
  it("keeps the letter record with more attempts, and letters only one side has", () => {
    const merged = mergeProgress(phone, laptop);
    expect(merged.letters).toEqual({
      "english:a": { correct: 5, wrong: 1, box: 3 },
      "english:b": { correct: 1, wrong: 0, box: 1 },
      "english:c": { correct: 3, wrong: 3, box: 0 },
    });
  });

  it("breaks an attempts tie with the higher box, then more correct answers", () => {
    const a = progress({ letters: { x: { correct: 2, wrong: 2, box: 1 } } });
    const b = progress({ letters: { x: { correct: 1, wrong: 3, box: 2 } } });
    expect(mergeProgress(a, b).letters.x).toEqual({ correct: 1, wrong: 3, box: 2 });
    const c = progress({ letters: { x: { correct: 3, wrong: 1, box: 1 } } });
    expect(mergeProgress(a, c).letters.x).toEqual({ correct: 3, wrong: 1, box: 1 });
  });

  it("takes the larger points and best streak", () => {
    const merged = mergeProgress(phone, laptop);
    expect(merged.points).toBe(120);
    expect(merged.bestStreak).toBe(5);
  });

  it("takes the streak from the copy played most recently", () => {
    const merged = mergeProgress(phone, laptop);
    expect(merged.lastPlayed).toBe("2026-11-15");
    expect(merged.streak).toBe(1);
  });

  it("takes the longer streak when both were played the same day", () => {
    const merged = mergeProgress(
      progress({ lastPlayed: "2026-11-15", streak: 4, bestStreak: 4 }),
      progress({ lastPlayed: "2026-11-15", streak: 2, bestStreak: 2 })
    );
    expect(merged.streak).toBe(4);
  });

  it("treats a copy never played as older than any day", () => {
    const merged = mergeProgress(emptyProgress(), phone);
    expect(merged.lastPlayed).toBe("2026-11-14");
    expect(merged.streak).toBe(3);
  });

  it("joins finished lessons per course, sorted", () => {
    expect(mergeProgress(phone, laptop).completedLessons).toEqual({
      english: ["a-e", "f-j"],
      greek: ["alpha"],
    });
  });

  it("keeps a new browser's progress on first sign-in to an empty account", () => {
    const merged = mergeProgress(phone, emptyProgress());
    expect(merged.points).toBe(phone.points);
    expect(merged.letters).toEqual(phone.letters);
    expect(merged.streak).toBe(phone.streak);
  });

  const samples = [emptyProgress(), phone, laptop, progress({ points: 500, lastPlayed: "2025-01-01", streak: 9, bestStreak: 9 })];

  it("is commutative", () => {
    for (const a of samples) {
      for (const b of samples) {
        expect(mergeProgress(a, b)).toEqual(mergeProgress(b, a));
      }
    }
  });

  it("is idempotent", () => {
    for (const a of samples) {
      for (const b of samples) {
        const once = mergeProgress(a, b);
        expect(mergeProgress(once, b)).toEqual(once);
        expect(mergeProgress(a, once)).toEqual(once);
        expect(mergeProgress(once, once)).toEqual(once);
      }
    }
  });

  it("is associative, so three devices agree whatever the order", () => {
    const [, a, b, c] = samples;
    expect(mergeProgress(mergeProgress(a, b), c)).toEqual(mergeProgress(a, mergeProgress(b, c)));
  });

  it("never mutates its inputs", () => {
    const before = JSON.stringify([phone, laptop]);
    const merged = mergeProgress(phone, laptop);
    merged.letters["english:a"].box = 0;
    merged.completedLessons.english.push("x");
    expect(JSON.stringify([phone, laptop])).toBe(before);
  });
});

describe("mergeDaily", () => {
  const day = "2026-11-15";
  const puzzle = puzzleForDay("english", day)!;
  const wrongWrite = cellsToGuess(wordCells("zzz", "english"));
  const rightWrite = cellsToGuess(wordCells(puzzle.write, "english"));
  const state = (english: DailyRecord, otherDay = day): DailyState => ({
    day: otherDay,
    courses: { english },
  });
  const record = (read: string[], write: string[], rewarded = false): DailyRecord => ({
    read,
    write,
    rewarded,
  });

  it("keeps the newer day's record and drops the older day", () => {
    const older = state(record(["aaa"], []), "2026-11-14");
    const newer = state(record([], []), day);
    expect(mergeDaily(older, newer)).toEqual(newer);
    expect(mergeDaily(newer, older)).toEqual(newer);
  });

  it("keeps either copy when the other has none", () => {
    const only = state(record(["aaa"], []));
    expect(mergeDaily(only, null)).toEqual(only);
    expect(mergeDaily(null, only)).toEqual(only);
    expect(mergeDaily(null, null)).toBeNull();
  });

  it("keeps the record with more tries whole, never a union of tries", () => {
    const a = state(record(["aaa", "bbb"], []));
    const b = state(record(["ccc"], []));
    expect(mergeDaily(a, b)!.courses.english.read).toEqual(["aaa", "bbb"]);
  });

  it("prefers a finished puzzle over an unfinished one with more tries", () => {
    const finished = state(record([puzzle.read], [rightWrite], true));
    const unfinished = state(record(["aaa", "bbb", "ccc"], [wrongWrite]));
    expect(mergeDaily(finished, unfinished)!.courses.english).toEqual(
      record([puzzle.read], [rightWrite], true)
    );
  });

  it("stays rewarded if either copy was, so points are never given twice", () => {
    const rewarded = state(record([puzzle.read], [rightWrite], true));
    const longer = state(record(["aaa", "bbb", puzzle.read], [wrongWrite, rightWrite]));
    const merged = mergeDaily(rewarded, longer)!.courses.english;
    expect(merged.rewarded).toBe(true);
    expect(merged.read).toEqual(["aaa", "bbb", puzzle.read]);
  });

  it("merges each course on its own", () => {
    const a: DailyState = { day, courses: { english: record(["aaa"], []) } };
    const b: DailyState = { day, courses: { greek: record(["αβγ"], []) } };
    expect(mergeDaily(a, b)).toEqual({
      day,
      courses: { english: record(["aaa"], []), greek: record(["αβγ"], []) },
    });
  });

  const samples: (DailyState | null)[] = [
    null,
    state(record([], [])),
    state(record(["aaa"], [])),
    state(record(["bbb"], [], true)),
    state(record([puzzle.read], [rightWrite], true)),
    state(record(["aaa", "bbb", "ccc"], [wrongWrite])),
    state(record(["zzz"], []), "2026-11-14"),
  ];

  it("is commutative and idempotent", () => {
    for (const a of samples) {
      for (const b of samples) {
        const once = mergeDaily(a, b);
        expect(once).toEqual(mergeDaily(b, a));
        expect(mergeDaily(once, b)).toEqual(once);
        expect(mergeDaily(a, once)).toEqual(once);
      }
    }
  });
});

describe("snapshots", () => {
  it("merges progress and daily together and compares by value", () => {
    const a: Snapshot = { progress: phone, daily: null };
    const b: Snapshot = { progress: laptop, daily: null };
    const merged = mergeSnapshots(a, b);
    expect(sameSnapshot(merged, mergeSnapshots(b, a))).toBe(true);
    expect(sameSnapshot(merged, a)).toBe(false);
    // Key order does not matter.
    const reordered = JSON.parse(JSON.stringify({ daily: null, progress: { ...phone } }));
    expect(sameSnapshot(reordered, a)).toBe(true);
  });
});
