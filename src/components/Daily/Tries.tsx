import React from "react";

export type TryRow = {
  /** For each place, what was tried there (a letter or a small cell). */
  places: React.ReactNode[];
  /** For each place, whether it was right. */
  marks: boolean[];
  /** The whole try in words, for screen readers. */
  text: React.ReactNode;
};

/**
 * The tries made so far, newest last. Each place is boxed: a right one is a
 * solid box with a tick, any other a dashed box with a dot, so the shape and
 * the mark say it as well as the colour. Screen readers get one sentence per
 * try instead of the boxes.
 */
export const Tries = ({ rows, label }: { rows: TryRow[]; label: string }) => {
  if (rows.length === 0) return null;
  return (
    <ol className="daily-tries" aria-label={label}>
      {rows.map((row, index) => (
        <li key={index} className="daily-try">
          <span className="daily-try-places" aria-hidden="true">
            {row.places.map((place, at) => (
              <span
                key={at}
                className="daily-place"
                data-mark={row.marks[at] ? "right" : "other"}
              >
                <span className="daily-place-value">{place}</span>
                <span className="daily-place-mark">{row.marks[at] ? "✓" : "·"}</span>
              </span>
            ))}
          </span>
          <span className="sr-only">{row.text}</span>
        </li>
      ))}
    </ol>
  );
};
