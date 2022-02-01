import React from "react";
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
  className?: string;
  onClick: (dot: keyof CellType) => void;
};

export const Dot = styled(({ cellId, isOn, className, onClick }: DotProps) => {
  return (
    <span
      className={className}
      style={{ backgroundColor: `${isOn ? "black" : "white"}` }}
      onClick={(event) => onClick(cellId)}
    >
      {cellId[3]}
    </span>
  );
})`
  border: 1px solid black;
  border-radius: 40px;
  padding: 4px 10px;
`;
