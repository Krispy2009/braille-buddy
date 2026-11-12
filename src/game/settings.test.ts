import { defaultSettings, loadSettings, saveSettings } from "./settings";

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

beforeEach(() => localStorage.clear());

test("a new player taps the cell; the brailler keys are opt-in", () => {
  expect(defaultSettings()).toEqual({ dotEntry: "cell" });
  expect(loadSettings(memoryStorage())).toEqual({ dotEntry: "cell" });
  expect(loadSettings()).toEqual({ dotEntry: "cell" });
});

test("saves and loads under a versioned key", () => {
  const storage = memoryStorage();
  expect(saveSettings({ dotEntry: "keys" }, storage)).toBe(true);
  expect(JSON.parse(storage.data.get(KEY) ?? "")).toEqual({
    version: 1,
    dotEntry: "keys",
  });
  expect(loadSettings(storage)).toEqual({ dotEntry: "keys" });
});

test("uses localStorage by default", () => {
  saveSettings({ dotEntry: "keys" });
  expect(JSON.parse(localStorage.getItem(KEY) ?? "")).toEqual({
    version: 1,
    dotEntry: "keys",
  });
  expect(loadSettings()).toEqual({ dotEntry: "keys" });
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
  expect(loadSettings(memoryStorage(raw))).toEqual({ dotEntry: "keys" });
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
  expect(saveSettings({ dotEntry: "keys" }, throwing)).toBe(false);
});

test("returns a fresh object each time", () => {
  const first = loadSettings(memoryStorage());
  first.dotEntry = "keys";
  expect(loadSettings(memoryStorage())).toEqual({ dotEntry: "cell" });
});
