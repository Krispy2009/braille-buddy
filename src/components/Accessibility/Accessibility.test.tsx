import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../App";
import { TEST_RESULTS } from "./content";

beforeEach(() => localStorage.clear());

const expectPage = () => {
  expect(screen.getByRole("heading", { level: 2, name: "Accessibility" })).toHaveFocus();
  expect(
    screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)
  ).toEqual([
    "Our goal",
    "What is built in",
    "Screen reader test results",
    "Known gaps",
    "Report a problem",
  ]);
};

test("opens from the footer on Home, and Back returns to Home", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Accessibility" }));
  expectPage();
  expect(screen.getByText(/WCAG 2\.2/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { level: 1, name: "Braille Buddy" })).toBeInTheDocument();
});

test("opens from Settings, and Back returns to Settings", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Settings" }));
  await user.click(screen.getByRole("button", { name: "Accessibility" }));
  expectPage();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { level: 2, name: "Settings" })).toBeInTheDocument();
});

test("the results table lists every setup as not tested yet", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Accessibility" }));
  const table = screen.getByRole("table");
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows).toHaveLength(TEST_RESULTS.length);
  expect(TEST_RESULTS).toHaveLength(6);
  rows.forEach((row) => expect(row).toHaveTextContent("Not tested yet"));
  expect(within(table).getByRole("rowheader", { name: "JAWS with Chrome" })).toBeInTheDocument();
  expect(within(table).getByRole("rowheader", { name: "VoiceOver" })).toBeInTheDocument();
});

test("links to report a problem on GitHub", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Accessibility" }));
  expect(screen.getByRole("link", { name: /Report a problem on\sGitHub/ })).toHaveAttribute(
    "href",
    "https://github.com/Krispy2009/braille-buddy/issues/new"
  );
});
