import React from "react";
import { BackIcon } from "../Icons/Icons";
import "./Privacy.css";

type PrivacyProps = {
  /** Shown only when accounts are on in this build. */
  accounts: boolean;
  /** Back to the screen this was opened from. */
  onBack: () => void;
};

/**
 * What Braille Buddy keeps about a player, in plain words. A reading page
 * like Accessibility: focus lands on its heading when it opens.
 */
export const Privacy = ({ accounts, onBack }: PrivacyProps) => {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="screen privacy">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h2 ref={headingRef} tabIndex={-1} className="frame-title">
          Privacy
        </h2>
      </header>

      <section aria-labelledby="privacy-no-account">
        <h3 id="privacy-no-account">Playing without an account</h3>
        <p>
          You never need an account to play. Without one, your progress and
          settings are kept only in this browser, on this device. Nothing about
          you is sent anywhere.
        </p>
      </section>

      {accounts && (
        <>
          <section aria-labelledby="privacy-stored">
            <h3 id="privacy-stored">What an account stores</h3>
            <ul>
              <li>Your email address, so you can sign in.</li>
              <li>
                Your progress: points, streaks, the letters and lessons you have
                practised, and today's daily puzzle.
              </li>
            </ul>
            <p>
              That is all. No name, no password, no tracking and no ads. Your
              settings, theme and course stay on each device and are not stored
              with your account.
            </p>
          </section>

          <section aria-labelledby="privacy-why">
            <h3 id="privacy-why">Why</h3>
            <p>
              Only to keep your progress safe and let you carry on from another
              device. Your email is used to send you sign-in codes, never for
              anything else. Nothing is sold or shared.
            </p>
          </section>

          <section aria-labelledby="privacy-where">
            <h3 id="privacy-where">Where</h3>
            {/* The Supabase project is in eu-west-1 (Ireland). TODO(Kristi):
                once sign-in emails go through your own email provider
                (custom SMTP), name it here too. */}
            <p>
              Accounts are run with Supabase, a database service, on servers
              in Ireland (EU). Your email address and progress are stored
              there, and sign-in emails are sent through it. Your progress is also kept in this browser, so
              you can play offline.
            </p>
          </section>

          <section aria-labelledby="privacy-delete">
            <h3 id="privacy-delete">Deleting your account</h3>
            <p>
              Your account is kept until you delete it. To delete it, open
              Account, sign in, and choose Delete my account. Your email address
              and saved progress are deleted from Supabase straight away.
            </p>
            <p>
              Progress kept in your browser is not touched, so you can keep
              playing. To remove it too, clear this site's data in your
              browser's settings.
            </p>
          </section>
        </>
      )}
    </div>
  );
};
