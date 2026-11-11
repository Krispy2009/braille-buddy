import type { ItemId } from "./braille";
import { MAX_BOX, type Progress } from "./progress";

/** Items in lower boxes come up more often: weight is 2 ** (4 - box). */
export const pickNextItem = (
  items: readonly ItemId[],
  progress: Progress,
  options: { previous?: ItemId; random?: () => number } = {}
): ItemId => {
  if (items.length === 0) {
    throw new Error("pickNextItem needs at least one item");
  }
  const { previous, random = Math.random } = options;
  const others = items.filter((item) => item !== previous);
  const candidates = others.length > 0 ? others : items;
  const weights = candidates.map(
    (item) => 2 ** (MAX_BOX - (progress.letters[item]?.box ?? 0))
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let target = random() * total;
  for (let index = 0; index < candidates.length; index++) {
    target -= weights[index];
    if (target < 0) return candidates[index];
  }
  return candidates[candidates.length - 1];
};

/** Wrong-answer options: distinct letters from the pool, never the answer. */
export const pickDistractors = (
  answer: string,
  pool: readonly string[],
  count: number,
  random: () => number = Math.random
): string[] => {
  const candidates = [...new Set(pool)].filter((letter) => letter !== answer);
  // Fisher-Yates shuffle
  for (let index = candidates.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }
  return candidates.slice(0, Math.max(count, 0));
};
