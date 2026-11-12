import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";

const SETTINGS_KEY = "braille-buddy:settings";

beforeEach(() => localStorage.clear());

afterEach(() => vi.restoreAllMocks());

const openSettings = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("tab", { name: "Settings" }));

const entryGroup = () => screen.getByRole("group", { name: "Entering dots" });
const courseGroup = () => screen.getByRole("group", { name: "Course" });

test("Settings is a third tab with the dot entry and course choices", async () => {
  const user = userEvent.setup();
  render(<App />);
  await openSettings(user);

  const panel = screen.getByRole("tabpanel", { name: "Settings" });
  expect(within(panel).getByRole("heading", { level: 2, name: "Settings" })).toBeInTheDocument();

  const radios = within(entryGroup()).getAllByRole("radio");
  expect(radios.map((radio) => radio.getAttribute("value"))).toEqual(["cell", "keys"]);
  // A new player taps the cell.
  expect(within(entryGroup()).getByRole("radio", { name: "Tap the cell" })).toBeChecked();
  expect(
    within(entryGroup()).getByRole("radio", { name: "Brailler keys" })
  ).toHaveAccessibleDescription(/like a Perkins brailler/);
  expect(
    within(entryGroup()).getByRole("radio", { name: "Tap the cell" })
  ).toHaveAccessibleDescription(/one at a time/);

  expect(within(courseGroup()).getByRole("radio", { name: "English" })).toBeChecked();
  // Changes apply at once: there is nothing to save, and nothing announced.
  expect(within(panel).queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("choosing Brailler keys changes Explore and Practice at once and is saved", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  await openSettings(user);

  const keys = screen.getByRole("radio", { name: "Brailler keys" });
  await user.click(keys);
  expect(keys).toBeChecked();
  expect(keys).toHaveFocus();
  expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "")).toEqual({
    version: 1,
    dotEntry: "keys",
  });

  await user.click(screen.getByRole("tab", { name: "Explore" }));
  expect(screen.getByRole("application", { name: "Brailler keys" })).toBeInTheDocument();
  expect(screen.queryByRole("group", { name: /braille cell/i })).not.toBeInTheDocument();

  // random() = 0 asks "write the letter a".
  vi.spyOn(Math, "random").mockReturnValue(0);
  await user.click(screen.getByRole("tab", { name: "Practice" }));
  await user.click(screen.getByRole("button", { name: "Start Letters a to e" }));
  expect(screen.getByRole("heading", { level: 3 })).toHaveAccessibleName(
    "Write the letter a in braille"
  );
  await user.click(screen.getByRole("button", { name: "Dot 1, key F" }));
  await user.click(screen.getByRole("button", { name: "Check" }));
  expect(screen.getByRole("status")).toHaveTextContent("Correct, plus 10 points.");

  // Remembered after a reload.
  unmount();
  render(<App />);
  expect(screen.getByRole("application", { name: "Brailler keys" })).toBeInTheDocument();
  await openSettings(user);
  expect(screen.getByRole("radio", { name: "Brailler keys" })).toBeChecked();

  // And back again.
  await user.click(screen.getByRole("radio", { name: "Tap the cell" }));
  await user.click(screen.getByRole("tab", { name: "Explore" }));
  expect(screen.getByRole("group", { name: /braille cell/i })).toBeInTheDocument();
  expect(screen.queryByRole("application", { name: "Brailler keys" })).not.toBeInTheDocument();
});

test("Change course opens Settings with focus on the chosen course", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);
  await user.click(screen.getByRole("tab", { name: "Practice" }));
  expect(screen.getByRole("heading", { level: 2, name: "English lessons" })).toBeInTheDocument();
  // The course is no longer picked from the lesson list.
  expect(screen.queryByRole("radio", { name: "Greek" })).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Change course" }));
  expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
  const english = within(courseGroup()).getByRole("radio", { name: "English" });
  expect(english).toHaveFocus();

  // Arrow keys move straight on to the other course.
  await user.keyboard("{ArrowDown}");
  const greek = within(courseGroup()).getByRole("radio", { name: "Greek" });
  expect(greek).toBeChecked();
  expect(greek).toHaveFocus();
  expect(localStorage.getItem("braille-buddy:practice-language")).toBe("greek");

  await user.click(screen.getByRole("tab", { name: "Practice" }));
  expect(screen.getByRole("heading", { level: 2, name: "Greek lessons" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Start Alpha to zeta" }));
  expect(
    screen.getByRole("heading", { level: 2, name: "Greek: Alpha to zeta" })
  ).toBeInTheDocument();

  // Remembered after a reload.
  unmount();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: "Practice" }));
  expect(screen.getByRole("heading", { level: 2, name: "Greek lessons" })).toBeInTheDocument();
});

test("opening Settings from its tab leaves focus on the tab", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("tab", { name: "Practice" }));
  await user.click(screen.getByRole("button", { name: "Change course" }));
  await user.click(screen.getByRole("tab", { name: "Explore" }));
  const tab = screen.getByRole("tab", { name: "Settings" });
  await user.click(tab);
  expect(tab).toHaveFocus();
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

  await user.click(screen.getByRole("tab", { name: "Explore" }));
  expect(screen.getByRole("application", { name: "Brailler keys" })).toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Practice" }));
  expect(screen.getByRole("heading", { level: 2, name: "Greek lessons" })).toBeInTheDocument();
});
