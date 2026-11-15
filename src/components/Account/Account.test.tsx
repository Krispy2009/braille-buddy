import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { AccountActions, AccountState, Result } from "../../account/types";
import { Account } from "./Account";

beforeEach(() => localStorage.clear());

type Fakes = Partial<Record<keyof AccountActions, (...args: never[]) => unknown>>;

/** The screen with a fake account: actions are spies that move the state on. */
const setup = (initial: AccountState = { phase: "signedOut" }, fakes: Fakes = {}) => {
  let setState: (next: AccountState) => void = () => {};
  const ok: Result = { ok: true };
  const actions = {
    load: vi.fn(),
    sendCode: vi.fn(async () => ok),
    verifyCode: vi.fn(async () => {
      setState({ phase: "signedIn", email: "kim@example.com", sync: "synced" });
      return ok;
    }),
    signOut: vi.fn(async () => {
      setState({ phase: "signedOut" });
      return ok;
    }),
    deleteAccount: vi.fn(async () => {
      setState({ phase: "signedOut" });
      return ok;
    }),
    syncNow: vi.fn(),
    ...fakes,
  } as unknown as { [K in keyof AccountActions]: AccountActions[K] & ReturnType<typeof vi.fn> };
  const onPrivacy = vi.fn();
  const onBack = vi.fn();
  const Harness = () => {
    const [state, set] = React.useState(initial);
    setState = set;
    return <Account state={state} actions={actions} onPrivacy={onPrivacy} onBack={onBack} />;
  };
  const user = userEvent.setup();
  render(<Harness />);
  return { user, actions, onPrivacy, onBack, setState: (next: AccountState) => setState(next) };
};

const status = () =>
  screen.getAllByRole("status").find((element) => element.classList.contains("account-status"))!;

test("opens with focus on the heading and loads the account code", () => {
  const { actions } = setup();
  expect(screen.getByRole("heading", { level: 2, name: "Account" })).toHaveFocus();
  expect(actions.load).toHaveBeenCalled();
});

test("the email field is labelled and fills from the browser", () => {
  setup();
  const email = screen.getByLabelText("Email address");
  expect(email).toHaveAttribute("type", "email");
  expect(email).toHaveAttribute("autocomplete", "email");
  expect(email).toHaveAccessibleDescription(/6-digit code/);
});

test("sending a code moves to the code box and says to check email", async () => {
  const { user, actions } = setup();
  await user.type(screen.getByLabelText("Email address"), " kim@example.com ");
  await user.click(screen.getByRole("button", { name: "Send me a code" }));
  expect(actions.sendCode).toHaveBeenCalledWith("kim@example.com");
  expect(status()).toHaveTextContent("Code sent. Check your email.");
  const code = screen.getByLabelText("Code from the email");
  expect(code).toHaveFocus();
  expect(code).toHaveAttribute("autocomplete", "one-time-code");
  expect(code).toHaveAttribute("inputmode", "numeric");
  expect(code).toHaveAccessibleDescription(/We sent a code to kim@example.com/);
});

test("a bad email is explained, tied to the field and announced", async () => {
  const { user, actions } = setup();
  await user.click(screen.getByRole("button", { name: "Send me a code" }));
  const email = screen.getByLabelText("Email address");
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(email).toHaveAccessibleDescription(/Type your email address\./);
  await user.type(email, "kim");
  await user.click(screen.getByRole("button", { name: "Send me a code" }));
  const error = screen.getByText(/does not look right/);
  expect(error).toHaveAttribute("aria-live", "polite");
  expect(email).toHaveFocus();
  expect(actions.sendCode).not.toHaveBeenCalled();
});

test("a server problem when sending is shown on the field", async () => {
  const { user } = setup(undefined, {
    sendCode: async () => ({ ok: false, error: "rateLimit" }) as Result,
  });
  await user.type(screen.getByLabelText("Email address"), "kim@example.com");
  await user.click(screen.getByRole("button", { name: "Send me a code" }));
  expect(screen.getByLabelText("Email address")).toHaveAccessibleDescription(/Too many emails/);
  expect(screen.queryByLabelText("Code from the email")).not.toBeInTheDocument();
});

test("typing the code signs in and moves focus to the signed-in card", async () => {
  const { user, actions } = setup();
  await user.type(screen.getByLabelText("Email address"), "kim@example.com");
  await user.click(screen.getByRole("button", { name: "Send me a code" }));
  await user.type(screen.getByLabelText("Code from the email"), "123 456");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(actions.verifyCode).toHaveBeenCalledWith("kim@example.com", "123456");
  expect(screen.getByRole("heading", { name: "Signed in" })).toHaveFocus();
  expect(screen.getByText("kim@example.com")).toBeInTheDocument();
  expect(screen.getByText("Synced")).toBeInTheDocument();
});

test("a wrong code is announced and the code box keeps focus", async () => {
  const { user } = setup(undefined, {
    verifyCode: async () => ({ ok: false, error: "badCode" }) as Result,
  });
  await user.type(screen.getByLabelText("Email address"), "kim@example.com");
  await user.click(screen.getByRole("button", { name: "Send me a code" }));
  const code = screen.getByLabelText("Code from the email");
  await user.type(code, "12");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(code).toHaveAccessibleDescription(/Type the 6-digit code/);
  await user.clear(code);
  await user.type(code, "999999{Enter}");
  expect(code).toHaveFocus();
  expect(code).toHaveAttribute("aria-invalid", "true");
  expect(code).toHaveAccessibleDescription(/That code did not work/);
});

test("the code box comes back after the app reloads, and can be left", async () => {
  localStorage.setItem(
    "braille-buddy:account-pending",
    JSON.stringify({ email: "kim@example.com", sent: Date.now() })
  );
  const { user } = setup();
  expect(screen.getByLabelText("Code from the email")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Use a different email" }));
  expect(screen.getByLabelText("Email address")).toHaveFocus();
  expect(localStorage.getItem("braille-buddy:account-pending")).toBeNull();
});

test("an expired sign-in link is explained", () => {
  setup({ phase: "signedOut", linkError: "expiredLink" });
  expect(status()).toHaveTextContent(/link has expired/);
});

test("sync problems are shown quietly with a way to try again", async () => {
  const { user, actions } = setup({ phase: "signedIn", email: "kim@example.com", sync: "offline" });
  expect(screen.getByText("Offline, will sync later")).toHaveAttribute("role", "status");
  await user.click(screen.getByRole("button", { name: "Try again now" }));
  expect(actions.syncNow).toHaveBeenCalled();
});

test("signing out says local progress stays", async () => {
  const { user, actions } = setup({ phase: "signedIn", email: "kim@example.com", sync: "synced" });
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(actions.signOut).toHaveBeenCalled();
  expect(status()).toHaveTextContent("Signed out. Your progress stays on this device.");
  expect(screen.getByRole("heading", { name: "Save your progress" })).toHaveFocus();
});

describe("deleting the account", () => {
  const signedIn: AccountState = { phase: "signedIn", email: "kim@example.com", sync: "synced" };

  test("asks first, and nothing is deleted until confirmed", async () => {
    const { user, actions } = setup(signedIn);
    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    const dialog = screen.getByRole("group", { name: "Delete your account?" });
    expect(dialog).toHaveAccessibleDescription(/cannot be undone.*Progress on this device stays/);
    expect(screen.getByRole("heading", { name: "Delete your account?" })).toHaveFocus();
    expect(actions.deleteAccount).not.toHaveBeenCalled();
  });

  test("Keep my account closes it and puts focus back", async () => {
    const { user, actions } = setup(signedIn);
    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.click(screen.getByRole("button", { name: "Keep my account" }));
    expect(screen.getByRole("button", { name: "Delete my account" })).toHaveFocus();
    expect(actions.deleteAccount).not.toHaveBeenCalled();
  });

  test("Escape closes it too", async () => {
    const { user } = setup(signedIn);
    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("group", { name: "Delete your account?" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete my account" })).toHaveFocus();
  });

  test("confirming deletes, signs out and says local progress stays", async () => {
    const { user, actions } = setup(signedIn);
    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete my account" }));
    expect(actions.deleteAccount).toHaveBeenCalledTimes(1);
    expect(status()).toHaveTextContent(
      "Your account is deleted. Your progress is still on this device"
    );
    expect(screen.getByRole("heading", { name: "Save your progress" })).toHaveFocus();
  });

  test("a failed deletion says so and keeps the account", async () => {
    const { user } = setup(signedIn, {
      deleteAccount: async () => ({ ok: false, error: "network" }) as Result,
    });
    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete my account" }));
    expect(status()).toHaveTextContent("Your account was not deleted. Could not reach the server.");
    expect(screen.getByRole("heading", { name: "Signed in" })).toBeInTheDocument();
  });
});

test("with no connection, offers to try again", async () => {
  const { user, actions } = setup({ phase: "unavailable" });
  expect(screen.getByText(/Accounts need an internet connection/)).toBeInTheDocument();
  actions.load.mockClear();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(actions.load).toHaveBeenCalled();
});

test("links to the privacy note", async () => {
  const { user, onPrivacy } = setup();
  await user.click(screen.getByRole("button", { name: /Privacy/ }));
  expect(onPrivacy).toHaveBeenCalled();
});
