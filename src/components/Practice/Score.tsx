type ScoreProps = {
  points: number;
  streak: number;
};

// Not a live region: the points gained are already part of each result, and
// repeating the totals after every answer would only add noise.
export const Score = ({ points, streak }: ScoreProps) => (
  <dl className="score">
    <div>
      <dt>Points</dt>
      <dd>{points}</dd>
    </div>
    <div>
      <dt>Daily streak</dt>
      <dd>
        {streak} {streak === 1 ? "day" : "days"}
      </dd>
    </div>
  </dl>
);
