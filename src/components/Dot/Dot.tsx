import styled from "styled-components";

import type { CellType } from "../../game/braille";

export type { CellType };

type DotProps = {
  cellId: keyof CellType;
  isOn: boolean;
  /** Without it the dot is a picture, not a button (read-only cells). */
  onClick?: (dot: keyof CellType) => void;
};

/* Raised: an orange dot standing on the plate, solid rim, hard shadow.
   Flat: a dimple pressed into the plate, dashed rim. Shape and rim tell
   them apart as well as colour. Sizes come from the cell (Cell.css). */
const DotButton = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--dot-size, 5rem);
  height: var(--dot-size, 5rem);
  padding: 0;
  border-radius: 50%;
  font-family: var(--font-ui);
  font-size: var(--dot-font-size, 1.5rem);
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 100ms ease, box-shadow 100ms ease;

  &:is(span) {
    cursor: default;
  }

  border: var(--line-width) ${({ $on }) => ($on ? "solid" : "dashed")} var(--line);
  color: ${({ $on }) => ($on ? "var(--on-accent)" : "var(--text-soft)")};
  background: ${({ $on }) => ($on ? "var(--accent)" : "var(--surface)")};
  box-shadow: ${({ $on }) =>
    $on
      ? "var(--dot-lift-x, 4px) var(--dot-lift-y, 5px) 0 var(--line)"
      : "inset 4px 4px 8px var(--shade), inset -4px -4px 8px var(--hi)"};

  &:is(button):active {
    transform: translate(2px, 3px);
  }

  @media (forced-colors: active) {
    border: 2px ${({ $on }) => ($on ? "solid" : "dashed")} ButtonText;
    background: ${({ $on }) => ($on ? "Highlight" : "ButtonFace")};
    color: ${({ $on }) => ($on ? "HighlightText" : "ButtonText")};
    forced-color-adjust: none;
  }
`;

export const Dot = ({ cellId, isOn, onClick }: DotProps) => {
  const number = cellId.slice(3);
  if (!onClick) {
    return (
      <DotButton as="span" $on={isOn}>
        {number}
      </DotButton>
    );
  }
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
