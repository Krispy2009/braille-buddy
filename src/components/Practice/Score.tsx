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
// one "Points" line, not the same number twice.
export const Score = ({ points, streak, course }: ScoreProps) => (
  <dl className="score">
    {course.points === points ? (
      <div>
        <dt>Points</dt>
        <dd>{points}</dd>
      </div>
    ) : (
      <>
        <div>
          <dt>{course.name} points</dt>
          <dd>{course.points}</dd>
        </div>
        <div>
          <dt>Total points</dt>
          <dd>{points}</dd>
        </div>
      </>
    )}
    <div>
      <dt>Daily streak</dt>
      <dd>
        {streak} {streak === 1 ? "day" : "days"}
      </dd>
    </div>
  </dl>
);
