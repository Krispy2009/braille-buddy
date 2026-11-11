import styled from "styled-components";

import type { CellType } from "../../game/braille";

export type { CellType };

type DotProps = {
  cellId: keyof CellType;
  isOn: boolean;
  /** Without it the dot is a picture, not a button (read-only cells). */
  onClick?: (dot: keyof CellType) => void;
};

const DotButton = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--dot-size, 4.5rem);
  height: var(--dot-size, 4.5rem);
  border-radius: 50%;
  padding: 0;
  font: inherit;
  font-size: var(--dot-font-size, 1.1rem);
  font-weight: var(--label-weight);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;

  &:is(span) {
    cursor: default;
  }

  /* Off: a dimple pressed into the plate. On: a raised dot. Colors come
     from the theme tokens in index.css. */
  color: ${({ $on }) => ($on ? "var(--dot-on-fg)" : "var(--dot-off-fg)")};
  background: ${({ $on }) => ($on ? "var(--dot-on-bg)" : "var(--dot-off-bg)")};
  border: 4px solid
    ${({ $on }) => ($on ? "var(--dot-on-border)" : "var(--dot-off-border)")};
  box-shadow: ${({ $on }) =>
    $on ? "var(--dot-on-shadow)" : "var(--dot-off-shadow)"};
  transform: ${({ $on }) => ($on ? "translateY(var(--dot-lift))" : "none")};

  &:focus-visible {
    outline: 3px solid var(--plate-focus);
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
