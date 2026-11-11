import {
  POINTS_PER_CORRECT,
  currentStreak,
  dayKey,
  emptyProgress,
  loadProgress,
  recordAnswer,
  saveProgress,
  type Progress,
} from "./progress";

const KEY = "braille-buddy:progress";
const A = "english:a" as const;
const B = "greek:ει" as const;

const at = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour, 30);

const memoryStorage = (initial?: string) => {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

const withDay = (lastPlayed: string | null, streak: number): Progress => ({
  ...emptyProgress(),
  lastPlayed,
  streak,
  bestStreak: streak,
});

describe("dayKey", () => {
  test("formats local dates with zero padding", () => {
    expect(dayKey(new Date(2026, 0, 5, 3))).toBe("2026-01-05");
    expect(dayKey(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });

  test("uses local time, not UTC", () => {
    expect(dayKey(new Date(2026, 5, 15, 0, 0, 1))).toBe("2026-06-15");
    expect(dayKey(new Date(2026, 5, 15, 23, 59, 59))).toBe("2026-06-15");
  });
});

describe("recordAnswer", () => {
  test("correct answer awards points and raises the box", () => {
    const next = recordAnswer(emptyProgress(), A, true, at(2026, 3, 10));
    expect(next.points).toBe(POINTS_PER_CORRECT);
    expect(next.letters[A]).toEqual({ correct: 1, wrong: 0, box: 1 });
  });

  test("box is capped at 4", () => {
    let progress = emptyProgress();
    for (let i = 0; i < 8; i++) {
      progress = recordAnswer(progress, A, true, at(2026, 3, 10));
    }
    expect(progress.letters[A].box).toBe(4);
    expect(progress.letters[A].correct).toBe(8);
  });

  test("wrong answer keeps points and drops the box to 0", () => {
    let progress = emptyProgress();
    for (let i = 0; i < 3; i++) {
      progress = recordAnswer(progress, A, true, at(2026, 3, 10));
    }
    const next = recordAnswer(progress, A, false, at(2026, 3, 10));
    expect(next.points).toBe(3 * POINTS_PER_CORRECT);
    expect(next.letters[A]).toEqual({ correct: 3, wrong: 1, box: 0 });
  });

  test("a first wrong answer creates stats and starts a streak", () => {
    const next = recordAnswer(emptyProgress(), B, false, at(2026, 3, 10));
    expect(next.letters[B]).toEqual({ correct: 0, wrong: 1, box: 0 });
    expect(next.points).toBe(0);
    expect(next.streak).toBe(1);
  });

  test("never mutates its input", () => {
    const original = recordAnswer(emptyProgress(), A, true, at(2026, 3, 10));
    const snapshot = structuredClone(original);
    Object.freeze(original.letters);
    Object.freeze(original.letters[A]);
    Object.freeze(original);
    const next = recordAnswer(original, A, true, at(2026, 3, 11));
    expect(original).toEqual(snapshot);
    expect(next).not.toBe(original);
    expect(next.letters).not.toBe(original.letters);
  });

  test("tracks letters independently", () => {
    let progress = recordAnswer(emptyProgress(), A, true, at(2026, 3, 10));
    progress = recordAnswer(progress, B, false, at(2026, 3, 10));
    expect(progress.letters[A].box).toBe(1);
    expect(progress.letters[B].box).toBe(0);
  });
});

describe("streak", () => {
  test("first answer starts a streak of 1", () => {
    const next = recordAnswer(emptyProgress(), A, true, at(2026, 3, 10));
    expect(next.streak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.lastPlayed).toBe("2026-03-10");
  });

  test("same day leaves the streak unchanged", () => {
    const progress = withDay("2026-03-10", 4);
    const next = recordAnswer(progress, A, true, at(2026, 3, 10, 22));
    expect(next.streak).toBe(4);
  });

  test("same day with a zero streak is at least 1", () => {
    const next = recordAnswer(withDay("2026-03-10", 0), A, true, at(2026, 3, 10));
    expect(next.streak).toBe(1);
  });

  test("the next day adds one and updates bestStreak", () => {
    const next = recordAnswer(withDay("2026-03-10", 4), A, true, at(2026, 3, 11));
    expect(next.streak).toBe(5);
    expect(next.bestStreak).toBe(5);
  });

  test("late night to early morning counts as the next day", () => {
    const next = recordAnswer(
      withDay("2026-03-10", 2),
      A,
      true,
      new Date(2026, 2, 11, 0, 5)
    );
    expect(next.streak).toBe(3);
  });

  test("a gap resets the streak but keeps bestStreak", () => {
    const progress = { ...withDay("2026-03-10", 6), bestStreak: 9 };
    const next = recordAnswer(progress, A, true, at(2026, 3, 12));
    expect(next.streak).toBe(1);
    expect(next.bestStreak).toBe(9);
  });

  test("wrong answers still count for the streak", () => {
    const next = recordAnswer(withDay("2026-03-10", 1), A, false, at(2026, 3, 11));
    expect(next.streak).toBe(2);
  });

  test("crosses month boundaries", () => {
    expect(
      recordAnswer(withDay("2026-01-31", 3), A, true, at(2026, 2, 1)).streak
    ).toBe(4);
    expect(
      recordAnswer(withDay("2026-04-30", 3), A, true, at(2026, 5, 1)).streak
    ).toBe(4);
  });

  test("crosses the year boundary", () => {
    expect(
      recordAnswer(withDay("2025-12-31", 7), A, true, at(2026, 1, 1)).streak
    ).toBe(8);
  });

  test("handles leap days", () => {
    expect(
      recordAnswer(withDay("2028-02-28", 2), A, true, at(2028, 2, 29)).streak
    ).toBe(3);
    expect(
      recordAnswer(withDay("2028-02-29", 2), A, true, at(2028, 3, 1)).streak
    ).toBe(3);
    expect(
      recordAnswer(withDay("2027-02-28", 2), A, true, at(2027, 3, 1)).streak
    ).toBe(3);
  });

  test("is safe across daylight saving changes", () => {
    // Dates around common DST switches; consecutive local days must
    // always count as consecutive whatever the offset does.
    const switches: [number, number][] = [
      [3, 8],
      [3, 9],
      [3, 28],
      [3, 29],
      [10, 25],
      [11, 1],
      [11, 2],
    ];
    for (const [month, day] of switches) {
      const before = new Date(2026, month - 1, day, 0, 10);
      const previous = new Date(2026, month - 1, day - 1, 23, 50);
      const progress = withDay(dayKey(previous), 2);
      expect(recordAnswer(progress, A, true, before).streak).toBe(3);
      const after = new Date(2026, month - 1, day + 1, 23, 50);
      expect(recordAnswer(progress, A, true, after).streak).toBe(1);
    }
  });

  test("a lastPlayed in the future counts as a gap", () => {
    const next = recordAnswer(withDay("2026-03-20", 5), A, true, at(2026, 3, 10));
    expect(next.streak).toBe(1);
  });
});

describe("currentStreak", () => {
  test("is 0 when nothing was played", () => {
    expect(currentStreak(emptyProgress(), at(2026, 3, 10))).toBe(0);
  });

  test("shows the streak when last played today or yesterday", () => {
    const progress = withDay("2026-03-10", 5);
    expect(currentStreak(progress, at(2026, 3, 10))).toBe(5);
    expect(currentStreak(progress, at(2026, 3, 11))).toBe(5);
  });

  test("lapses after a missed day", () => {
    expect(currentStreak(withDay("2026-03-10", 5), at(2026, 3, 12))).toBe(0);
  });

  test("works across month and year boundaries", () => {
    expect(currentStreak(withDay("2025-12-31", 3), at(2026, 1, 1))).toBe(3);
    expect(currentStreak(withDay("2025-12-31", 3), at(2026, 1, 2))).toBe(0);
  });
});

describe("loadProgress", () => {
  const roundTrip = () => {
    let progress = recordAnswer(emptyProgress(), A, true, at(2026, 3, 10));
    progress = recordAnswer(progress, B, false, at(2026, 3, 11));
    return progress;
  };

  test("returns empty progress when nothing is stored", () => {
    expect(loadProgress(memoryStorage())).toEqual(emptyProgress());
  });

  test("round-trips saved progress", () => {
    const storage = memoryStorage();
    const progress = roundTrip();
    expect(saveProgress(progress, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(progress);
  });

  test.each([
    ["not JSON", "{nope"],
    ["null", "null"],
    ["an array", "[]"],
    ["a number", "42"],
    ["a string", '"hi"'],
    ["wrong version", JSON.stringify({ ...emptyProgress(), version: 2 })],
    ["missing version", JSON.stringify({ points: 1 })],
    ["string points", JSON.stringify({ ...emptyProgress(), points: "10" })],
    ["negative points", JSON.stringify({ ...emptyProgress(), points: -5 })],
    ["fractional streak", JSON.stringify({ ...emptyProgress(), streak: 1.5 })],
    ["NaN-like bestStreak", JSON.stringify({ ...emptyProgress(), bestStreak: null })],
    ["bad lastPlayed", JSON.stringify({ ...emptyProgress(), lastPlayed: "yesterday" })],
    ["impossible date", JSON.stringify({ ...emptyProgress(), lastPlayed: "2026-02-31" })],
    ["numeric lastPlayed", JSON.stringify({ ...emptyProgress(), lastPlayed: 20260310 })],
  ])("falls back to empty progress for %s", (_name, raw) => {
    expect(loadProgress(memoryStorage(raw))).toEqual(emptyProgress());
  });

  test("drops invalid letter entries and keeps valid ones", () => {
    const raw = JSON.stringify({
      ...emptyProgress(),
      points: 20,
      letters: {
        "english:a": { correct: 2, wrong: 1, box: 3 },
        "english:b": { correct: "2", wrong: 0, box: 1 },
        "english:c": null,
        "english:d": { correct: 1, wrong: 0 },
        "english:e": { correct: -1, wrong: 0, box: 0 },
        "english:f": "x",
      },
    });
    const loaded = loadProgress(memoryStorage(raw));
    expect(loaded.points).toBe(20);
    expect(loaded.letters).toEqual({
      "english:a": { correct: 2, wrong: 1, box: 3 },
    });
  });

  test("clamps out-of-range boxes", () => {
    const raw = JSON.stringify({
      ...emptyProgress(),
      letters: { "english:a": { correct: 1, wrong: 0, box: 99 } },
    });
    expect(loadProgress(memoryStorage(raw)).letters["english:a"].box).toBe(4);
  });

  test("treats a non-object letters field as empty", () => {
    const raw = JSON.stringify({ ...emptyProgress(), points: 5, letters: [1, 2] });
    const loaded = loadProgress(memoryStorage(raw));
    expect(loaded.points).toBe(5);
    expect(loaded.letters).toEqual({});
  });

  test("ignores a __proto__ key and unknown extra fields", () => {
    const raw =
      '{"version":1,"points":1,"streak":0,"bestStreak":0,"lastPlayed":null,' +
      '"extra":true,"letters":{"__proto__":{"correct":1,"wrong":0,"box":0}}}';
    const loaded = loadProgress(memoryStorage(raw));
    expect(Object.keys(loaded)).not.toContain("extra");
    expect(Object.keys(loaded.letters)).toEqual([]);
    expect(Object.getPrototypeOf(loaded.letters)).toBe(Object.prototype);
  });

  test("bestStreak is never below streak", () => {
    const raw = JSON.stringify({ ...emptyProgress(), streak: 5, bestStreak: 2 });
    expect(loadProgress(memoryStorage(raw)).bestStreak).toBe(5);
  });

  test("returns empty progress when getItem throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("denied");
      },
    };
    expect(loadProgress(storage)).toEqual(emptyProgress());
  });

  test("returns a fresh object each time", () => {
    expect(loadProgress(memoryStorage())).not.toBe(loadProgress(memoryStorage()));
  });

  describe("default storage", () => {
    afterEach(() => {
      vi.restoreAllMocks();
      window.localStorage.clear();
    });

    test("reads and writes window.localStorage", () => {
      const progress = roundTrip();
      expect(saveProgress(progress)).toBe(true);
      expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(progress));
      expect(loadProgress()).toEqual(progress);
    });

    test("survives localStorage access throwing", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(loadProgress()).toEqual(emptyProgress());
      expect(saveProgress(emptyProgress())).toBe(false);
    });
  });
});

describe("saveProgress", () => {
  test("writes JSON under the storage key", () => {
    const storage = memoryStorage();
    const progress = recordAnswer(emptyProgress(), A, true, at(2026, 3, 10));
    saveProgress(progress, storage);
    expect(JSON.parse(storage.getItem(KEY) ?? "")).toEqual(progress);
  });

  test("returns false when setItem throws", () => {
    const storage = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(saveProgress(emptyProgress(), storage)).toBe(false);
  });
});
