import type { ItemId } from "./braille";
import { emptyProgress, type Progress } from "./progress";
import { pickDistractors, pickNextItem } from "./review";

const A: ItemId = "english:a";
const B: ItemId = "english:b";
const C: ItemId = "english:c";

const withBoxes = (boxes: Record<string, number>): Progress => ({
  ...emptyProgress(),
  letters: Object.fromEntries(
    Object.entries(boxes).map(([id, box]) => [id, { correct: 0, wrong: 0, box }])
  ),
});

/** Sequence of values, repeating the last one. */
const sequence = (...values: number[]) => {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
};

describe("pickNextItem", () => {
  test("throws on an empty list", () => {
    expect(() => pickNextItem([], emptyProgress())).toThrow();
  });

  test("returns the only item, even when it is the previous one", () => {
    expect(pickNextItem([A], emptyProgress(), { previous: A })).toBe(A);
  });

  test("never returns previous when there are alternatives", () => {
    const progress = emptyProgress();
    for (let i = 0; i < 200; i++) {
      const random = () => i / 200;
      expect(pickNextItem([A, B, C], progress, { previous: B, random })).not.toBe(B);
    }
  });

  test("works with real randomness and never repeats previous", () => {
    for (let i = 0; i < 200; i++) {
      expect(pickNextItem([A, B], emptyProgress(), { previous: A })).toBe(B);
    }
  });

  test("an unknown previous does not change the pool", () => {
    expect(
      pickNextItem([A, B], emptyProgress(), {
        previous: "greek:α",
        random: () => 0,
      })
    ).toBe(A);
  });

  test("weights lower boxes more heavily (2 ** (4 - box))", () => {
    // Box 0 -> 16, box 2 -> 4, box 4 -> 1; total 21.
    const progress = withBoxes({ [A]: 0, [B]: 2, [C]: 4 });
    const pick = (value: number) =>
      pickNextItem([A, B, C], progress, { random: () => value });
    expect(pick(0)).toBe(A);
    expect(pick(15.9 / 21)).toBe(A);
    expect(pick(16 / 21)).toBe(B);
    expect(pick(19.9 / 21)).toBe(B);
    expect(pick(20 / 21)).toBe(C);
    expect(pick(0.999999)).toBe(C);
  });

  test("items without stats count as box 0", () => {
    const progress = withBoxes({ [B]: 4 });
    // A has weight 16, B has weight 1.
    const pick = (value: number) =>
      pickNextItem([A, B], progress, { random: () => value });
    expect(pick(15.9 / 17)).toBe(A);
    expect(pick(16 / 17)).toBe(B);
  });

  test("distribution follows the weights", () => {
    const progress = withBoxes({ [A]: 0, [B]: 4 });
    const counts = { [A]: 0, [B]: 0 };
    const steps = 1700;
    for (let i = 0; i < steps; i++) {
      const picked = pickNextItem([A, B], progress, {
        random: () => i / steps,
      });
      counts[picked as typeof A | typeof B]++;
    }
    expect(counts[A]).toBe(1600);
    expect(counts[B]).toBe(100);
  });

  test("excluding previous renormalises the weights", () => {
    const progress = withBoxes({ [A]: 0, [B]: 0, [C]: 4 });
    // Candidates are B (16) and C (1).
    expect(
      pickNextItem([A, B, C], progress, { previous: A, random: () => 0.9 })
    ).toBe(B);
    expect(
      pickNextItem([A, B, C], progress, { previous: A, random: () => 0.99 })
    ).toBe(C);
  });

  test("stays in range when random is just below 1", () => {
    expect(
      pickNextItem([A, B, C], emptyProgress(), { random: () => 0.9999999999 })
    ).toBe(C);
  });

  test("does not mutate its inputs", () => {
    const items = Object.freeze([A, B, C]);
    const progress = Object.freeze(withBoxes({ [A]: 1 }));
    expect(() => pickNextItem(items, progress, { previous: A })).not.toThrow();
  });
});

describe("pickDistractors", () => {
  const pool = ["a", "b", "c", "d", "e", "f"];

  test("returns the requested number of distinct letters", () => {
    const result = pickDistractors("a", pool, 3);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
  });

  test("never includes the answer", () => {
    for (let i = 0; i < 100; i++) {
      expect(pickDistractors("a", pool, 5, () => i / 100)).not.toContain("a");
    }
  });

  test("returns fewer when the pool is too small", () => {
    expect(pickDistractors("a", ["a", "b", "c"], 5).sort()).toEqual(["b", "c"]);
    expect(pickDistractors("a", ["a"], 3)).toEqual([]);
    expect(pickDistractors("a", [], 3)).toEqual([]);
  });

  test("removes duplicates from the pool", () => {
    const result = pickDistractors("a", ["b", "b", "b", "c", "a"], 3);
    expect(result.sort()).toEqual(["b", "c"]);
  });

  test("returns an empty list for a count of 0 or less", () => {
    expect(pickDistractors("a", pool, 0)).toEqual([]);
    expect(pickDistractors("a", pool, -2)).toEqual([]);
  });

  test("shuffles deterministically using random", () => {
    const low = pickDistractors("z", ["a", "b", "c", "d"], 4, () => 0);
    const high = pickDistractors("z", ["a", "b", "c", "d"], 4, () => 0.999);
    expect(low).toEqual(["b", "c", "d", "a"]);
    expect(high).toEqual(["a", "b", "c", "d"]);
    expect(pickDistractors("z", ["a", "b", "c", "d"], 4, () => 0)).toEqual(low);
  });

  test("returns every letter of the pool exactly once when count covers it", () => {
    const result = pickDistractors("a", pool, 99, sequence(0.3, 0.7, 0.1, 0.9));
    expect(result.sort()).toEqual(["b", "c", "d", "e", "f"]);
  });

  test("handles Greek digraphs as single letters", () => {
    const result = pickDistractors("ει", ["α", "ει", "ου", "β"], 2);
    expect(result).toHaveLength(2);
    expect(result).not.toContain("ει");
  });

  test("does not mutate the pool", () => {
    const frozen = Object.freeze([...pool]);
    expect(() => pickDistractors("a", frozen, 3)).not.toThrow();
  });
});
