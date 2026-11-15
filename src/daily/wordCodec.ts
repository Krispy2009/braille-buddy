/**
 * Light obfuscation for the daily puzzle word lists, so the answers don't
 * read as plain text on GitHub or in the built JS bundle.
 *
 * The lists are stored as: UTF-8 bytes of the newline-joined words, XOR-ed
 * with a fixed repeating key, then base64. This is NOT security. Anyone who
 * reads this file can decode the lists; it only guards against casual
 * spoilers. If the daily puzzle ever gets a leaderboard, the server must hand
 * out the words (or check answers) instead of shipping the list.
 *
 * `scripts/daily-words.mjs` implements the same encoding for editing the
 * lists; keep the key in sync with it (a test checks they agree).
 */
export const WORD_KEY = "braille-buddy/daily";

/** Decodes an encoded word list (see above) to the words, in order. */
export const decodeWords = (encoded: string): string[] => {
  const binary = atob(encoded.trim());
  const key = new TextEncoder().encode(WORD_KEY);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index) ^ key[index % key.length];
  }
  return new TextDecoder().decode(bytes).split("\n");
};
