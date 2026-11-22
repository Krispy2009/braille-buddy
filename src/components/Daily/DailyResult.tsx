import React from "react";
import {
  DailyPuzzle,
  gridRow,
  halfResult,
  MAX_TRIES,
  shareMessage,
} from "../../daily/daily";
import { daysInARow } from "../Practice/Score";
import { Word } from "./Word";

type DailyResultProps = {
  puzzle: DailyPuzzle;
  courseName: string;
  read: readonly boolean[];
  write: readonly boolean[];
  /** Points this puzzle gave. */
  earned: number;
  streak: number;
  onBack: () => void;
  headingRef: React.Ref<HTMLHeadingElement>;
};

type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** The share sheet where there is one, else the clipboard. */
export const shareResult = async (text: string): Promise<ShareOutcome> => {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Not allowed here (an insecure page, say): copy instead.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
};

const SHARE_STATUS: Record<ShareOutcome, string> = {
  shared: "Result shared.",
  copied: "Result copied. Paste it anywhere to share it.",
  cancelled: "Not shared.",
  failed: "Could not copy the result. Select the text above and copy it yourself.",
};

/** "in 2 tries", or that the answer was shown once every try was used. */
const triesText = (attempts: readonly boolean[]) => {
  const half = halfResult(attempts);
  return half.solved
    ? `in ${half.tries} ${half.tries === 1 ? "try" : "tries"}`
    : `answer shown after ${MAX_TRIES} tries`;
};

/**
 * The finished puzzle: one row per half with its word, how many tries it
 * took and that half's row of the share grid (which gives no word away), then
 * the day's points and the way to share. The date and course are in the
 * screen's eyebrow, so the rows don't repeat them; the full sentence is in
 * what gets shared.
 */
export const DailyResult = ({
  puzzle,
  courseName,
  read,
  write,
  earned,
  streak,
  onBack,
  headingRef,
}: DailyResultProps) => {
  const [status, setStatus] = React.useState("");
  const message = shareMessage(puzzle, courseName, read, write);

  const share = async () => {
    setStatus("");
    setStatus(SHARE_STATUS[await shareResult(message)]);
  };

  return (
    <div className="daily-half daily-result">
      <h3 ref={headingRef} tabIndex={-1} className="task">
        Today's result
      </h3>
      <ul className="daily-tally">
        {(
          [
            ["Read it", puzzle.read, read],
            ["Write it", puzzle.write, write],
          ] as const
        ).map(([name, word, attempts]) => (
          <li key={name} className="daily-tally-row">
            <span className="daily-tally-name">{name}</span>
            <span className="daily-tally-word">
              <Word word={word} language={puzzle.course} />
            </span>
            <span className="daily-tally-tries">{triesText(attempts)}</span>
            {/* The tries in words say the same for screen readers. */}
            <span className="daily-tally-cells" aria-hidden="true">
              {gridRow(attempts)}
            </span>
          </li>
        ))}
      </ul>
      <p className="eyebrow daily-points">
        +{earned} points today · {daysInARow(streak)}
      </p>
      <p role="status" className="feedback daily-status">
        {status}
      </p>
      <div className="action daily-actions">
        <button type="button" className="primary-button" onClick={share}>
          Share result
        </button>
        <p className="help">A new puzzle comes at midnight.</p>
        <button type="button" className="quiet-button" onClick={onBack}>
          Back to Home
        </button>
      </div>
    </div>
  );
};
