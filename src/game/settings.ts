/** How the player raises dots when writing a letter. */
export const DOT_ENTRIES = ["cell", "keys"] as const;
export type DotEntry = (typeof DOT_ENTRIES)[number];

/**
 * Player settings, saved next to progress. To add one: give it a field here,
 * a default in defaultSettings and a check in VALIDATORS. A saved value that
 * fails its check falls back to its default without touching the others.
 */
export type Settings = {
  dotEntry: DotEntry;
  /** Print F D S J K L under the numbers on the brailler keys. */
  keyLetters: boolean;
  /** No sinking keys, sliding cards or other movement. */
  lessMotion: boolean;
  /** Scales the whole interface up by a quarter. */
  biggerText: boolean;
};

const VERSION = 1;
const STORAGE_KEY = "braille-buddy:settings";

// Until the player chooses, Less motion follows the device's own setting.
const prefersReducedMotion = (): boolean => {
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

export const defaultSettings = (): Settings => ({
  dotEntry: "cell",
  keyLetters: true,
  lessMotion: prefersReducedMotion(),
  biggerText: false,
});

const isBoolean = (value: unknown) => typeof value === "boolean";

const VALIDATORS: { [K in keyof Settings]: (value: unknown) => boolean } = {
  dotEntry: (value) => DOT_ENTRIES.includes(value as DotEntry),
  keyLetters: isBoolean,
  lessMotion: isBoolean,
  biggerText: isBoolean,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const defaultStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const loadSettings = (
  storage?: Pick<Storage, "getItem">
): Settings => {
  const settings = defaultSettings();
  try {
    const source = storage ?? defaultStorage();
    const raw = source?.getItem(STORAGE_KEY);
    if (!raw) return settings;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== VERSION) return settings;
    for (const key of Object.keys(VALIDATORS) as (keyof Settings)[]) {
      if (VALIDATORS[key](data[key])) {
        (settings as Record<keyof Settings, unknown>)[key] = data[key];
      }
    }
    return settings;
  } catch {
    return defaultSettings();
  }
};

/** Returns true if saved. Storage errors (private mode, quota) are swallowed. */
export const saveSettings = (
  settings: Settings,
  storage?: Pick<Storage, "setItem">
): boolean => {
  try {
    const target = storage ?? defaultStorage();
    if (!target) return false;
    target.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...settings }));
    return true;
  } catch {
    return false;
  }
};
