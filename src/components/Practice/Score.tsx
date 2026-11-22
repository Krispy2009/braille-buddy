/**
 * Points and the daily streak are said the same way everywhere (Home, the
 * lesson list, a finished lesson, the daily result): "120 points",
 * "4 days in a row".
 */
export const daysInARow = (streak: number): string => `${streak} ${daysWord(streak)}`;

/** The words after the number, for a total set as <b>4</b> days in a row. */
export const daysWord = (streak: number): string =>
  streak === 1 ? "day in a row" : "days in a row";

type ScoreProps = {
  points: number;
  streak: number;
  /** Points earned in the chosen course. */
  course: { name: string; points: number };
};

// Not a live region: the points gained are already part of each result, and
// repeating the totals after every answer would only add noise. Shown on the
// lesson list, never next to a question.
// Until points come from a second course, the course's points are the total:
// one points line, not the same number twice. The commas are for screen
// readers; on screen the totals sit apart.
export const Score = ({ points, streak, course }: ScoreProps) => (
  <p className="score">
    {course.points === points ? (
      <span>
        <b>{points}</b> points
      </span>
    ) : (
      <>
        <span>
          <b>{course.points}</b> {course.name} points
        </span>
        <span className="sr-only">, </span>
        <span>
          <b>{points}</b> points in all
        </span>
      </>
    )}
    <span className="sr-only">, </span>
    <span>
      <b>{streak}</b> {daysWord(streak)}
    </span>
  </p>
);
