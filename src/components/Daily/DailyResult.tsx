import React from "react";
import {
  DailyPuzzle,
  shareGrid,
  shareMessage,
  shareSummary,
} from "../../daily/daily";
import { Word } from "./Word";

type DailyResultProps = {
  puzzle: DailyPuzzle;
  courseName: string;
  read: readonly boolean[];
  write: readonly boolean[];
  /** Points this puzzle gave. */
  earned: number;
  /** Points in all, now. */
  points: number;
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

/**
 * The finished puzzle: the result in words, a grid of braille cells to share
 * that gives no word away, and the day's words.
 */
export const DailyResult = ({
  puzzle,
  courseName,
  read,
  write,
  earned,
  points,
  streak,
  onBack,
  headingRef,
}: DailyResultProps) => {
  const [status, setStatus] = React.useState("");
  const summary = shareSummary(puzzle, courseName, read, write);
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
      <div className="daily-share-card">
        <p className="daily-summary">{summary}</p>
        {/* The sentence above says the same for screen readers. */}
        <pre className="daily-grid" aria-hidden="true">
          {shareGrid(read, write)}
        </pre>
      </div>
      <p className="eyebrow">
        +{earned} pts today · {points} pts in all · day {streak}
      </p>
      <p className="daily-words">
        Today's words: <Word word={puzzle.read} language={puzzle.course} /> to read and{" "}
        <Word word={puzzle.write} language={puzzle.course} /> to write.
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
