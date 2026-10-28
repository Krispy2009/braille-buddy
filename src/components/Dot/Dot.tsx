import styled from "styled-components";

export type CellType = {
  dot1: boolean;
  dot2: boolean;
  dot3: boolean;
  dot4: boolean;
  dot5: boolean;
  dot6: boolean;
};

type DotProps = {
  cellId: keyof CellType;
  isOn: boolean;
  onClick: (dot: keyof CellType) => void;
};

const DotButton = styled.button<{ $on: boolean }>`
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  border: 0;
  padding: 0;
  font: inherit;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;

  /* Off: a dimple pressed into the plate. On: a raised, pale dot. */
  color: ${({ $on }) => ($on ? "#1c2745" : "#a9b4d0")};
  background: ${({ $on }) =>
    $on
      ? "radial-gradient(circle at 35% 30%, #fffaf0, #e9e1cc 75%)"
      : "#0f1830"};
  box-shadow: ${({ $on }) =>
    $on
      ? "0 5px 10px rgba(0, 0, 0, 0.5), inset -2px -3px 5px rgba(0, 0, 0, 0.14)"
      : "inset 0 4px 8px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.08)"};
  transform: ${({ $on }) => ($on ? "translateY(-2px)" : "none")};

  &:focus-visible {
    outline: 3px solid #ffb703;
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (forced-colors: active) {
    border: 2px solid ButtonText;
    background: ${({ $on }) => ($on ? "Highlight" : "ButtonFace")};
    color: ${({ $on }) => ($on ? "HighlightText" : "ButtonText")};
    forced-color-adjust: none;
  }
`;

export const Dot = ({ cellId, isOn, onClick }: DotProps) => {
  const number = cellId.slice(3);
  return (
    <DotButton
      type="button"
      $on={isOn}
      aria-pressed={isOn}
      aria-label={`Dot ${number}`}
      onClick={() => onClick(cellId)}
    >
      {number}
    </DotButton>
  );
};
