/** Lowers every dot. A quiet text button: it is never the main action. */
export const ClearButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="quiet-button" onClick={onClick}>
    Clear dots
  </button>
);
