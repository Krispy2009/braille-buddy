import React from "react";
import { BackIcon } from "../Icons/Icons";
import {
  BUILT_IN,
  GOAL,
  KNOWN_GAPS,
  REPORT_URL,
  TEST_RESULTS,
} from "./content";
import "./Accessibility.css";

type AccessibilityProps = {
  /** Back to the screen this was opened from. */
  onBack: () => void;
};

/**
 * A plain reading page: a goal, what is built in, an honest test table, the
 * known gaps and how to report a problem. Focus lands on the page heading
 * when it opens, as on Settings.
 */
export const Accessibility = ({ onBack }: AccessibilityProps) => {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="screen accessibility">
      <header className="frame">
        <button type="button" className="round-button" aria-label="Back" onClick={onBack}>
          <BackIcon />
        </button>
        <h2 ref={headingRef} tabIndex={-1} className="frame-title">
          Accessibility
        </h2>
      </header>

      <section aria-labelledby="a11y-goal">
        <h3 id="a11y-goal">Our goal</h3>
        <p>{GOAL}</p>
      </section>

      <section aria-labelledby="a11y-built-in">
        <h3 id="a11y-built-in">What is built in</h3>
        <ul>
          {BUILT_IN.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="a11y-tests">
        <h3 id="a11y-tests">Screen reader test results</h3>
        <div className="a11y-table-wrap">
          <table>
            <caption className="sr-only">
              Screen reader and browser combinations, and whether Braille Buddy
              has been tested with each
            </caption>
            <thead>
              <tr>
                <th scope="col">Screen reader and browser</th>
                <th scope="col">Device</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {TEST_RESULTS.map(({ setup, platform, status, tested, notes }) => (
                <tr key={`${setup} ${platform}`}>
                  <th scope="row">{setup}</th>
                  <td>{platform}</td>
                  <td>
                    {status}
                    {tested && <span className="a11y-note"> Tested {tested}.</span>}
                    {notes && <span className="a11y-note"> {notes}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="a11y-gaps">
        <h3 id="a11y-gaps">Known gaps</h3>
        <ul>
          {KNOWN_GAPS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="a11y-report">
        <h3 id="a11y-report">Report a problem</h3>
        <p>
          If something does not work for you, please tell us which screen
          reader, browser and device you use and what happened.{" "}
          <a href={REPORT_URL} target="_blank" rel="noreferrer">
            Report a problem on&nbsp;GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </section>
    </div>
  );
};
