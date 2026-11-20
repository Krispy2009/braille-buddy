import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// The Supabase code is only ever loaded with import(); this stands in for it
// and records whether it was loaded at all.
const startAccount = vi.fn(async (_config: unknown, events: { onUser: (email: string | null) => void }) => {
  events.onUser(null);
  return {
    linkError: null,
    sendCode: vi.fn(),
    verifyCode: vi.fn(),
    signOut: vi.fn(),
    deleteAccount: vi.fn(),
    syncNow: vi.fn(),
    dispose: vi.fn(),
  };
});
vi.mock("./account/supabaseAccount", () => ({ startAccount }));

beforeEach(() => {
  localStorage.clear();
  startAccount.mockClear();
  window.history.replaceState(null, "", "/");
});

test("a player without an account never loads the account code", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Settings" }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(startAccount).not.toHaveBeenCalled();
});

test("Account on Home opens the Account screen, which loads the account code", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Account" }));
  expect(screen.getByRole("heading", { level: 2, name: "Account" })).toHaveFocus();
  expect(await screen.findByLabelText("Email address")).toBeInTheDocument();
  expect(startAccount).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("button", { name: "Account" })).toHaveFocus();
});

test("a saved session loads the account code as the app starts", async () => {
  localStorage.setItem("sb-hynbvcxulcklilmeqjtj-auth-token", "{}");
  render(<App />);
  await vi.waitFor(() => expect(startAccount).toHaveBeenCalled());
  expect(screen.getByRole("heading", { name: "Braille Buddy" })).toBeInTheDocument();
});

test("opening a sign-in link shows the Account screen", async () => {
  window.history.replaceState(null, "", "/#access_token=abc&refresh_token=def");
  render(<App />);
  expect(screen.getByRole("heading", { level: 2, name: "Account" })).toBeInTheDocument();
  await vi.waitFor(() => expect(startAccount).toHaveBeenCalled());
});

test("Privacy is linked from Home, Settings and Account", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Privacy" }));
  expect(screen.getByRole("heading", { level: 2, name: "Privacy" })).toHaveFocus();
  expect(screen.getByRole("heading", { name: "What an account stores" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Back" }));

  await user.click(screen.getByRole("button", { name: "Settings" }));
  await user.click(screen.getByRole("button", { name: "Privacy" }));
  expect(screen.getByRole("heading", { level: 2, name: "Privacy" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(screen.getByRole("button", { name: /Privacy/ }));
  expect(screen.getByRole("heading", { level: 2, name: "Privacy" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("heading", { level: 2, name: "Account" })).toBeInTheDocument();
});
