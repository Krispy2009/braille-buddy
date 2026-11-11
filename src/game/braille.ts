import mappings from "../components/Board/mappings.json";

export type CellType = {
  dot1: boolean;
  dot2: boolean;
  dot3: boolean;
  dot4: boolean;
  dot5: boolean;
  dot6: boolean;
};

export type DotKey = keyof CellType;

export type Language = keyof typeof mappings;

/** Identifies one thing to learn, e.g. "english:a" or "greek:ει". */
export type ItemId = `${Language}:${string}`;

export const LANGUAGES = Object.keys(mappings) as Language[];

export const LANGUAGE_LABELS: Record<Language, string> = {
  english: "English",
  greek: "Greek",
};

/** BCP 47 tags, for the `lang` attribute on letters. */
export const LANGUAGE_TAGS: Record<Language, string> = {
  english: "en",
  greek: "el",
};

export const DOT_KEYS: readonly DotKey[] = [
  "dot1",
  "dot2",
  "dot3",
  "dot4",
  "dot5",
  "dot6",
];

export const CLEAR_CELL: CellType = {
  dot1: false,
  dot2: false,
  dot3: false,
  dot4: false,
  dot5: false,
  dot6: false,
};

/** A cell as six characters, dot 1 first: dots 1 and 2 raised is "110000". */
export const cellToBitmap = (cell: CellType): string =>
  DOT_KEYS.map((dot) => (cell[dot] ? "1" : "0")).join("");

export const bitmapToCell = (bitmap: string): CellType =>
  Object.fromEntries(
    DOT_KEYS.map((dot, index) => [dot, bitmap[index] === "1"])
  ) as CellType;

/** The raised dot numbers of a cell, in order: [1, 4, 5]. */
export const raisedDots = (cell: CellType): number[] =>
  DOT_KEYS.filter((dot) => cell[dot]).map((dot) => Number(dot.slice(3)));

const table = (language: Language): Record<string, string> =>
  mappings[language] as Record<string, string>;

export const letterForCell = (
  cell: CellType,
  language: Language
): string | undefined => table(language)[cellToBitmap(cell)];

/** Every letter (or letter pair) a language teaches, in mapping order. */
export const lettersIn = (language: Language): string[] =>
  Object.values(table(language));

export const cellForLetter = (
  letter: string,
  language: Language
): CellType | undefined => {
  const entry = Object.entries(table(language)).find(
    ([, value]) => value === letter
  );
  return entry ? bitmapToCell(entry[0]) : undefined;
};

export const itemId = (language: Language, letter: string): ItemId =>
  `${language}:${letter}`;

export const parseItemId = (
  id: ItemId
): { language: Language; letter: string } => {
  const separator = id.indexOf(":");
  return {
    language: id.slice(0, separator) as Language,
    letter: id.slice(separator + 1),
  };
};

// Screen readers without a Greek voice spell Greek characters as symbols
// ("greek letter epsilon") and drop the rest of a diphthong, so we announce
// the letter names instead: ει is read as "epsilon iota".
const GREEK_NAMES: Record<string, string> = {
  α: "alpha",
  β: "beta",
  γ: "gamma",
  δ: "delta",
  ε: "epsilon",
  ζ: "zeta",
  η: "eta",
  θ: "theta",
  ι: "iota",
  κ: "kappa",
  λ: "lambda",
  μ: "mu",
  ν: "nu",
  ξ: "xi",
  ο: "omicron",
  π: "pi",
  ρ: "rho",
  σ: "sigma",
  τ: "tau",
  υ: "upsilon",
  φ: "phi",
  χ: "chi",
  ψ: "psi",
  ω: "omega",
};

export const speakGreek = (letters: string): string =>
  [...letters].map((letter) => GREEK_NAMES[letter] ?? letter).join(" ");

/** How a letter should be announced by a screen reader. */
export const spokenLetter = (letter: string, language: Language): string =>
  language === "greek" ? speakGreek(letter) : letter;
