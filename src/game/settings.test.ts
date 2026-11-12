import { defaultSettings, loadSettings, saveSettings, Settings } from "./settings";

const KEY = "braille-buddy:settings";

const memoryStorage = (initial?: string) => {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(KEY, initial);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

const DEFAULTS: Settings = {
  dotEntry: "cell",
  keyLetters: true,
  lessMotion: false,
  biggerText: false,
};

const KEYS: Settings = { ...DEFAULTS, dotEntry: "keys" };

beforeEach(() => localStorage.clear());

afterEach(() => {
  // @ts-expect-error removing the stub again
  delete window.matchMedia;
});

test("a new player taps the cell; the brailler keys are opt-in", () => {
  expect(defaultSettings()).toEqual(DEFAULTS);
  expect(loadSettings(memoryStorage())).toEqual(DEFAULTS);
  expect(loadSettings()).toEqual(DEFAULTS);
});

test("Less motion starts from the device's reduced motion setting", () => {
  window.matchMedia = (query: string) =>
    ({ matches: query === "(prefers-reduced-motion: reduce)" }) as MediaQueryList;
  expect(defaultSettings().lessMotion).toBe(true);
  expect(loadSettings(memoryStorage())).toEqual({ ...DEFAULTS, lessMotion: true });
  // A choice the player saved wins over the device.
  const saved = JSON.stringify({ version: 1, dotEntry: "cell", lessMotion: false });
  expect(loadSettings(memoryStorage(saved)).lessMotion).toBe(false);
});

test("settings saved before the comfort switches existed keep their entry mode", () => {
  const raw = JSON.stringify({ version: 1, dotEntry: "keys" });
  expect(loadSettings(memoryStorage(raw))).toEqual(KEYS);
});

test("saves and loads the comfort switches", () => {
  const storage = memoryStorage();
  const comfy: Settings = { dotEntry: "cell", keyLetters: false, lessMotion: true, biggerText: true };
  saveSettings(comfy, storage);
  expect(loadSettings(storage)).toEqual(comfy);
});

test("a bad comfort value falls back to its default alone", () => {
  const raw = JSON.stringify({
    version: 1,
    dotEntry: "keys",
    keyLetters: "no",
    lessMotion: 1,
    biggerText: true,
  });
  expect(loadSettings(memoryStorage(raw))).toEqual({ ...KEYS, biggerText: true });
});

test("saves and loads under a versioned key", () => {
  const storage = memoryStorage();
  expect(saveSettings(KEYS, storage)).toBe(true);
  expect(JSON.parse(storage.data.get(KEY) ?? "")).toEqual({ version: 1, ...KEYS });
  expect(loadSettings(storage)).toEqual(KEYS);
});

test("uses localStorage by default", () => {
  saveSettings(KEYS);
  expect(JSON.parse(localStorage.getItem(KEY) ?? "")).toEqual({ version: 1, ...KEYS });
  expect(loadSettings()).toEqual(KEYS);
});

test.each([
  ["not JSON", "{oops"],
  ["not an object", "[1, 2]"],
  ["null", "null"],
  ["another version", JSON.stringify({ version: 2, dotEntry: "keys" })],
  ["no version", JSON.stringify({ dotEntry: "keys" })],
  ["an unknown entry mode", JSON.stringify({ version: 1, dotEntry: "voice" })],
  ["a wrong type", JSON.stringify({ version: 1, dotEntry: 1 })],
])("falls back to the defaults for %s", (_, raw) => {
  expect(loadSettings(memoryStorage(raw))).toEqual(defaultSettings());
});

test("ignores fields it does not know", () => {
  const raw = JSON.stringify({ version: 1, dotEntry: "keys", sparkle: true });
  expect(loadSettings(memoryStorage(raw))).toEqual(KEYS);
});

test("tolerates storage that throws", () => {
  const throwing = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  };
  expect(loadSettings(throwing)).toEqual(defaultSettings());
  expect(saveSettings(KEYS, throwing)).toBe(false);
});

test("returns a fresh object each time", () => {
  const first = loadSettings(memoryStorage());
  first.dotEntry = "keys";
  expect(loadSettings(memoryStorage())).toEqual(DEFAULTS);
});
