import React from "react";
import { clearPendingEmail, loadPendingEmail, savePendingEmail } from "../../account/pending";
import { emailCodeEnabled } from "../../account/config";
import type { AccountActions, AccountState } from "../../account/types";
import { BackIcon } from "../Icons/Icons";
import { checkEmail, cleanCode, CODE_ERROR, errorText, SYNC_TEXT } from "./messages";
import "./Account.css";

type AccountProps = {
  state: AccountState;
  actions: AccountActions;
  /** Opens the Privacy page. */
  onPrivacy: () => void;
  /** Back to the screen this was opened from. */
  onBack: () => void;
  /** Whether the sign-in email has a code to type. Defaults to the build setting. */
  emailCode?: boolean;
};

type FocusTarget = "title" | "step" | "email" | "code" | "confirm" | "delete";

/**
 * Sign in with an emailed code (when enabled) or the link in the email, see that
 * progress is synced, sign out, or delete the account. Optional: the game
 * never asks for it. Focus lands on the page heading when it opens, then on
 * each new step's heading or field. Messages go to live regions and stay
 * until something else replaces them.
 */
export const Account = ({
  state,
  actions,
  onPrivacy,
  onBack,
  emailCode = emailCodeEnabled(),
}: AccountProps) => {
  const id = React.useId();
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const stepRef = React.useRef<HTMLHeadingElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const codeRef = React.useRef<HTMLInputElement>(null);
  const confirmRef = React.useRef<HTMLHeadingElement>(null);
  const deleteRef = React.useRef<HTMLButtonElement>(null);
  const [focus, setFocus] = React.useState<{ target: FocusTarget }>({ target: "title" });
  const [pendingEmail, setPendingEmail] = React.useState(() => loadPendingEmail());
  const [email, setEmail] = React.useState(() => pendingEmail ?? "");
  const [code, setCode] = React.useState("");
  const [fieldError, setFieldError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    const refs = {
      title: titleRef,
      step: stepRef,
      email: emailRef,
      code: codeRef,
      confirm: confirmRef,
      delete: deleteRef,
    };
    refs[focus.target].current?.focus();
  }, [focus]);

  // Opening the screen is when the account code is first needed.
  React.useEffect(() => actions.load(), [actions]);

  // Signed in or out from elsewhere (another tab, a sign-in link): say so by
  // moving to the new step. Not when the account code first loads.
  const previousPhase = React.useRef(state.phase);
  React.useEffect(() => {
    const before = previousPhase.current;
    previousPhase.current = state.phase;
    const settled = (phase: string) => phase === "signedIn" || phase === "signedOut";
    if (before !== state.phase && settled(before) && settled(state.phase)) {
      stepRef.current?.focus();
    }
  }, [state.phase]);

  const linkError = state.phase === "signedOut" ? state.linkError : undefined;
  const status = message || (linkError ? errorText(linkError, emailCode) : "");
  const errorId = `${id}-error`;
  const codeStep = state.phase === "signedOut" && pendingEmail !== undefined;

  const run = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const sendCode = (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    const problem = checkEmail(address);
    if (problem) {
      setFieldError(problem);
      setFocus({ target: "email" });
      return;
    }
    void run(async () => {
      setMessage("");
      const result = await actions.sendCode(address);
      if (!result.ok) {
        setFieldError(errorText(result.error, emailCode));
        return;
      }
      savePendingEmail(address);
      setPendingEmail(address);
      setCode("");
      setFieldError("");
      setMessage(emailCode ? "Code sent. Check your email." : "Link sent. Check your email.");
      setFocus({ target: emailCode ? "code" : "step" });
    });
  };

  const verify = (event: React.FormEvent) => {
    event.preventDefault();
    const digits = cleanCode(code);
    if (!digits || !pendingEmail) {
      setFieldError(CODE_ERROR);
      setFocus({ target: "code" });
      return;
    }
    void run(async () => {
      const result = await actions.verifyCode(pendingEmail, digits);
      if (!result.ok) {
        setFieldError(errorText(result.error, emailCode));
        setFocus({ target: "code" });
        return;
      }
      clearPendingEmail();
      setPendingEmail(undefined);
      setFieldError("");
      setMessage("You are signed in.");
      setFocus({ target: "step" });
    });
  };

  const resend = () =>
    run(async () => {
      if (!pendingEmail) return;
      const result = await actions.sendCode(pendingEmail);
      if (!result.ok) {
        setFieldError(errorText(result.error, emailCode));
        return;
      }
      savePendingEmail(pendingEmail);
      setFieldError("");
      setCode("");
      setMessage(
        emailCode
          ? `We sent a new code to ${pendingEmail}.`
          : `We sent a new link to ${pendingEmail}.`
      );
      setFocus({ target: emailCode ? "code" : "step" });
    });

  const changeEmail = () => {
    clearPendingEmail();
    setPendingEmail(undefined);
    setFieldError("");
    setMessage("");
    setFocus({ target: "email" });
  };

  const signOut = () =>
    run(async () => {
      await actions.signOut();
      setConfirming(false);
      setMessage("Signed out. Your progress stays on this device.");
      setFocus({ target: "step" });
    });

  const startDelete = () => {
    setMessage("");
    setConfirming(true);
    setFocus({ target: "confirm" });
  };

  const cancelDelete = () => {
    setConfirming(false);
    setFocus({ target: "delete" });
  };

  const confirmDelete = () =>
    run(async () => {
      const result = await actions.deleteAccount();
      if (!result.ok) {
        setMessage(`Your account was not deleted. ${errorText(result.error, emailCode)}`);
        return;
      }
      setConfirming(false);
      setMessage(
        "Your account is deleted. Your progress is still on this device, and you can keep playing."
      );
      setFocus({ target: "step" });
    });

  let body: React.ReactNode;
  if (state.phase === "signedIn") {
    body = (
      <>
        <section className="account-card" aria-labelledby={`${id}-step`}>
          <h3 ref={stepRef} id={`${id}-step`} tabIndex={-1} className="account-step">
            Signed in
          </h3>
          <p className="account-email">{state.email}</p>
          <p className="account-text">
            Your progress is saved with your account. Sign in with the same email
            on another device to carry on there.
          </p>
          <div className="account-sync">
            <p role="status" className="account-sync-state" data-sync={state.sync ?? "syncing"}>
              <span aria-hidden="true">{state.sync === "synced" ? "✓ " : ""}</span>
              {SYNC_TEXT[state.sync ?? "syncing"]}
            </p>
            {(state.sync === "offline" || state.sync === "error") && (
              <button type="button" className="quiet-button" onClick={actions.syncNow}>
                Try again now
              </button>
            )}
          </div>
          <button
            type="button"
            className="outline-button account-wide"
            aria-disabled={busy || undefined}
            onClick={signOut}
          >
            Sign out
          </button>
        </section>

        <section className="account-danger" aria-labelledby={`${id}-delete`}>
          <h3 id={`${id}-delete`} className="account-small-heading">
            Delete account
          </h3>
          {!confirming ? (
            <button
              ref={deleteRef}
              type="button"
              className="quiet-button account-delete"
              onClick={startDelete}
            >
              Delete my account
            </button>
          ) : (
            <div
              className="account-confirm"
              role="group"
              aria-labelledby={`${id}-confirm`}
              aria-describedby={`${id}-confirm-text`}
              onKeyDown={(event) => {
                if (event.key === "Escape") cancelDelete();
              }}
            >
              <h4
                ref={confirmRef}
                id={`${id}-confirm`}
                tabIndex={-1}
                className="account-confirm-title"
              >
                Delete your account?
              </h4>
              <p id={`${id}-confirm-text`} className="account-text">
                This deletes your email address and the progress saved with your
                account, for good. It cannot be undone. Progress on this device
                stays, and you can keep playing without an account.
              </p>
              <div className="account-confirm-actions">
                <button type="button" className="primary-button" onClick={cancelDelete}>
                  Keep my account
                </button>
                <button
                  type="button"
                  className="outline-button"
                  aria-disabled={busy || undefined}
                  onClick={confirmDelete}
                >
                  {busy ? "Deleting…" : "Yes, delete my account"}
                </button>
              </div>
            </div>
          )}
        </section>
      </>
    );
  } else if (codeStep && !emailCode) {
    body = (
      <section className="account-card" aria-labelledby={`${id}-step`}>
        <h3 ref={stepRef} id={`${id}-step`} tabIndex={-1} className="account-step">
          Check your email
        </h3>
        <p className="account-text">
          We sent a sign-in link to <strong className="account-address">{pendingEmail}</strong>.
          Open it on this device, in this browser, to sign in.
        </p>
        <p id={errorId} className="account-error" aria-live="polite">
          {fieldError}
        </p>
        <div className="account-links">
          <button type="button" className="quiet-button" onClick={resend}>
            Send a new link
          </button>
          <button type="button" className="quiet-button" onClick={changeEmail}>
            Use a different email
          </button>
        </div>
      </section>
    );
  } else if (codeStep) {
    body = (
      <section className="account-card" aria-labelledby={`${id}-step`}>
        <h3 ref={stepRef} id={`${id}-step`} tabIndex={-1} className="account-step">
          Check your email
        </h3>
        <p id={`${id}-code-hint`} className="account-text">
          We sent a code to <strong className="account-address">{pendingEmail}</strong>.
          Type it here, or open the link in the email on this device.
        </p>
        <form className="account-form" noValidate onSubmit={verify}>
          <label htmlFor={`${id}-code`} className="account-label">
            Code from the email
          </label>
          <input
            ref={codeRef}
            id={`${id}-code`}
            className="account-input account-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={12}
            spellCheck={false}
            value={code}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={`${id}-code-hint ${errorId}`}
            onChange={(event) => setCode(event.currentTarget.value)}
          />
          <p id={errorId} className="account-error" aria-live="polite">
            {fieldError}
          </p>
          <button type="submit" className="primary-button" aria-disabled={busy || undefined}>
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
        <div className="account-links">
          <button type="button" className="quiet-button" onClick={resend}>
            Send a new code
          </button>
          <button type="button" className="quiet-button" onClick={changeEmail}>
            Use a different email
          </button>
        </div>
      </section>
    );
  } else if (state.phase === "signedOut") {
    body = (
      <section className="account-card" aria-labelledby={`${id}-step`}>
        <h3 ref={stepRef} id={`${id}-step`} tabIndex={-1} className="account-step">
          Save your progress
        </h3>
        <p className="account-text">
          Sign in to keep your points, streak and letters safe, and to carry
          them to your other devices. You can always play without an account.
        </p>
        <form className="account-form" noValidate onSubmit={sendCode}>
          <label htmlFor={`${id}-email`} className="account-label">
            Email address
          </label>
          <input
            ref={emailRef}
            id={`${id}-email`}
            className="account-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={`${id}-email-hint ${errorId}`}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <p id={`${id}-email-hint`} className="account-hint">
            {emailCode
              ? "We will email you a 6-digit code. No password needed."
              : "We will email you a sign-in link. No password needed."}
          </p>
          <p id={errorId} className="account-error" aria-live="polite">
            {fieldError}
          </p>
          <button type="submit" className="primary-button" aria-disabled={busy || undefined}>
            {busy ? "Sending…" : emailCode ? "Send me a code" : "Send me a link"}
          </button>
        </form>
      </section>
    );
  } else if (state.phase === "unavailable") {
    body = (
      <section className="account-card" aria-labelledby={`${id}-step`}>
        <h3 ref={stepRef} id={`${id}-step`} tabIndex={-1} className="account-step">
          No connection
        </h3>
        <p className="account-text">
          Accounts need an internet connection. You can keep playing without
          one, and your progress stays on this device.
        </p>
        <button type="button" className="outline-button account-wide" onClick={actions.load}>
          Try again
        </button>
      </section>
    );
  } else if (state.phase === "off") {
    body = <p className="account-text">Accounts are not available in this version.</p>;
  } else {
    body = <p className="account-text">Loading…</p>;
  }

  return (
    <div className="screen account">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h2 ref={titleRef} tabIndex={-1} className="frame-title">
          Account
        </h2>
      </header>

      {/* Always on the page, so a new message is announced when it appears. */}
      <p role="status" className="account-status">
        {status}
      </p>

      {body}

      <button type="button" className="quiet-button account-privacy" onClick={onPrivacy}>
        Privacy: what an account stores
      </button>
    </div>
  );
};
