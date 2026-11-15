import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { WORD_LISTS } from "./daily";
import { decodeWords } from "./wordCodec";
import { encode } from "../../scripts/daily-words.mjs";

const sha = (words: readonly string[]) => createHash("sha256").update(words.join("\n")).digest("hex");

describe("daily word lists", () => {
  // Fingerprints of the lists as they were when stored as plain JSON, so a
  // change to the words or their order (which would change past and future
  // puzzles) fails here without the lists being committed in plain text.
  it("english list is unchanged", () => {
    expect(WORD_LISTS.english).toHaveLength(220);
    expect(WORD_LISTS.english[0]).toBe("cat");
    expect(WORD_LISTS.english.at(-1)).toBe("grape");
    expect(sha(WORD_LISTS.english)).toBe("7cc60ccd608f480648dad1fa846e4141f09afd4858274cf9138edb6d3e2f41b4");
  });

  it("greek list is unchanged", () => {
    expect(WORD_LISTS.greek).toHaveLength(145);
    expect(WORD_LISTS.greek[0]).toBe("γατα");
    expect(WORD_LISTS.greek.at(-1)).toBe("πιανο");
    expect(sha(WORD_LISTS.greek)).toBe("74305b13cab3a73d4720b8d9b9a81ced7c4182d0cef6ef199b270aeec4377cff");
  });
});

describe("word codec", () => {
  const sample = ["alpha", "βήτα", "gamma"];

  it("round-trips, keeping order and non-ASCII text", () => {
    expect(decodeWords(encode(sample))).toEqual(sample);
  });

  it("does not leave the words readable", () => {
    expect(encode(sample)).not.toContain("alpha");
  });

  it("the script's encoder and decoder agree with the app's", () => {
    expect(decodeWords(encode(WORD_LISTS.greek))).toEqual(WORD_LISTS.greek);
    const shown = execFileSync("node", ["scripts/daily-words.mjs", "decode", "el"], { encoding: "utf8" });
    expect(shown.trim().split("\n")).toEqual(WORD_LISTS.greek);
  });
});
