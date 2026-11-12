import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

const SETTINGS_KEY = "braille-buddy:settings";

beforeEach(() => localStorage.clear());

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.motion;
  delete document.documentElement.dataset.text;
});

/** Settings is reached from the gear on Home. */
const openSettings = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Settings" }));

const back = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Back" }));

const entryGroup = () => screen.getByRole("group", { name: "Entering dots" });
const courseGroup = () => screen.getByRole("group", { name: "Course" });
const comfortGroup = () => screen.getByRole("group", { name: "Comfort" });

const saved = () => JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");

test("Settings is its own screen with dot entry, theme, comfort and course", async () => {
  const user = userEvent.setup();
  render(<App />);
  await openSettings(user);

  expect(screen.getByRole("heading", { level: 2, name: "Settings" })).toHaveFocus();
  // Nothing from Home comes along.
  expect(screen.queryByRole("button", { name: "Press new cards" })).not.toBeInTheDocument();

  const radios = within(entryGroup()).getAllByRole("radio");
  expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["cell", "keys"]);
  // A new player taps the cell.
  expect(within(entryGroup()).getByRole("radio", { name: "Tap the cell" })).toBeChecked();
  expect(
    within(entryGroup()).getByRole("radio", { name: "Brailler keys" })
  ).toHaveAccessibleDescription("Six keys, like a real braille typewriter");
  expect(
    within(entryGroup()).getByRole("radio", { name: "Tap the cell" })
  ).toHaveAccessibleDescription("Tap each dot of one big cell");
  expect(within(entryGroup()).getByText("Keyboard keys F D S J K L always work.")).toBeVisible();

  expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();

  expect(
    within(comfortGroup())
      .getAllByRole("switch")
      .map((toggle) => [toggle.closest("label")?.textContent, (toggle as HTMLInputElement).checked])
  ).toEqual([
    ["Show key letters on keys", true],
    ["Less motion", false],
    ["Bigger text", false],
  ]);

  // Each course in its own language, named in English for screen readers.
  expect(within(courseGroup()).getByRole("radio", { name: "English" })).toBeChecked();
  const greek = within(courseGroup()).getByRole("radio", { name: "Greek" });
  expect(within(greek.closest("label") as HTMLElement).getByText("Ελληνικά")).toHaveAttribute(
    "lang",
    "el"
  );

  // Changes apply at once: there is nothing to save, and nothing announced.
  expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("choosing Brailler keys changes Explore and lessons at once and is saved", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  await openSettings(user);

  const keys = screen.getByRole("radio", { name: "Brailler keys" });
  await user.click(keys);
  expect(keys).toBeChecked();
  expect(keys).toHaveFocus();
  expect(saved()).toMatchObject({ version: 1, dotEntry: "keys" });

  await back(user);
  await user.click(screen.getByRole("button", { name: "Explore the cell" }));
  expect(screen.getByRole("application", { name: "Brailler keys" })).toBeInTheDocument();
  expect(screen.queryByRole("group", { name: /braille cell/i })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Home" }));

  // random() = 0 asks "write the letter a".
  vi.spyOn(Math, "random").mockReturnValue(0);
  await user.click(screen.getByRole("button", { name: "Press new cards" }));
  expect(screen.getByRole("heading", { level: 3 })).toHaveAccessibleName(
    "Write the letter a in braille"
  );
  await user.click(screen.getByRole("button", { name: "Dot 1, key F" }));
  await user.click(screen.getByRole("button", { name: "Press it" }));
  expect(screen.getByRole("status")).toHaveTextContent("Correct, plus 10 points.");

  // Remembered after a reload.
  unmount();
  render(<App />);
  await openSettings(user);
  expect(screen.getByRole("radio", { name: "Brailler keys" })).toBeChecked();

  // And back again.
  await user.click(screen.getByRole("radio", { name: "Tap the cell" }));
  await back(user);
  await user.click(screen.getByRole("button", { name: "Explore the cell" }));
  expect(screen.getByRole("group", { name: /braille cell/i })).toBeInTheDocument();
  expect(screen.queryByRole("application", { name: "Brailler keys" })).not.toBeInTheDocument();
});

test("Change course opens Settings at the course, and Back returns to the lessons", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  await user.click(screen.getByRole("button", { name: "Lessons" }));
  expect(screen.getByRole("heading", { level: 2, name: "English lessons" })).toBeInTheDocument();
  // The course is not picked from the lesson list.
  expect(screen.queryByRole("radio", { name: "Greek" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Change course" }));
  const english = within(courseGroup()).getByRole("radio", { name: "English" });
  expect(english).toHaveFocus();

  // Arrow keys move straight on to the other course.
  await user.keyboard("{ArrowDown}");
  const greek = within(courseGroup()).getByRole("radio", { name: "Greek" });
  expect(greek).toBeChecked();
  expect(greek).toHaveFocus();
  expect(localStorage.getItem("braille-buddy:practice-language")).toBe("greek");

  await back(user);
  expect(screen.getByRole("heading", { level: 2, name: "Greek lessons" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Change course" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Start Alpha to zeta" }));
  expect(
    screen.getByRole("heading", { level: 2, name: "Greek: Alpha to zeta" })
  ).toBeInTheDocument();

  // Remembered after a reload.
  unmount();
  render(<App />);
  expect(screen.getByText("Greek · 0 of 32 letters learnt")).toBeInTheDocument();
});

test("the comfort switches take effect at once and are saved", async () => {
  vi.spyOn(Math, "random").mockReturnValue(0);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: 1, dotEntry: "keys" }));
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  const root = document.documentElement;
  expect(root.dataset.motion).toBe("full");
  expect(root.dataset.text).toBe("normal");

  await openSettings(user);
  await user.click(screen.getByRole("switch", { name: "Bigger text" }));
  expect(root.dataset.text).toBe("bigger");
  await user.click(screen.getByRole("switch", { name: "Less motion" }));
  expect(root.dataset.motion).toBe("less");
  await user.click(screen.getByRole("switch", { name: "Show key letters on keys" }));
  expect(screen.getByRole("switch", { name: "Show key letters on keys" })).not.toBeChecked();
  expect(saved()).toEqual({
    version: 1,
    dotEntry: "keys",
    keyLetters: false,
    lessMotion: true,
    biggerText: true,
  });

  // The key letters go from the keys, but stay in their names.
  await back(user);
  await user.click(screen.getByRole("button", { name: "Press new cards" }));
  const keys = screen.getByRole("application", { name: "Brailler keys" });
  expect(keys).toHaveClass("no-letters");
  expect(screen.getByRole("button", { name: "Dot 1, key F" })).toBeInTheDocument();

  unmount();
  render(<App />);
  expect(root.dataset.text).toBe("bigger");
  expect(root.dataset.motion).toBe("less");
});

test("Less motion follows the device until the player chooses", () => {
  window.matchMedia = (query: string) =>
    ({ matches: query === "(prefers-reduced-motion: reduce)" }) as MediaQueryList;
  render(<App />);
  expect(document.documentElement.dataset.motion).toBe("less");
  // @ts-expect-error removing the stub again
  delete window.matchMedia;
});

test("settings still change when storage throws", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const user = userEvent.setup();
  render(<App />);
  await openSettings(user);
  await user.click(screen.getByRole("radio", { name: "Brailler keys" }));
  await user.click(screen.getByRole("radio", { name: "Greek" }));
  await back(user);

  await user.click(screen.getByRole("button", { name: "Explore the cell" }));
  expect(screen.getByRole("application", { name: "Brailler keys" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Home" }));
  await user.click(screen.getByRole("button", { name: "Lessons" }));
  expect(screen.getByRole("heading", { level: 2, name: "Greek lessons" })).toBeInTheDocument();
});
