import React from "react";
import styled from "styled-components";
import "./App.css";

type CellType = {
  dot1: boolean;
  dot2: boolean;
  dot3: boolean;
  dot4: boolean;
  dot5: boolean;
  dot6: boolean;
};

const Cell: React.FC = () => {
  const [cells, setCells] = React.useState({
    dot1: false,
    dot2: false,
    dot3: false,
    dot4: false,
    dot5: false,
    dot6: false,
  });

  const onClick = (dot: keyof CellType) => {
    const newCells: CellType = { ...cells };
    newCells[dot] = !cells[dot];
    setCells(newCells);
    console.log(newCells);
  };

  return (
    <div className="cell">
      <Dot cellId={"dot1"} isOn={cells.dot1} onClick={onClick} />
      <Dot cellId={"dot2"} isOn={cells.dot2} onClick={onClick} />
      <Dot cellId={"dot3"} isOn={cells.dot3} onClick={onClick} />
      <Dot cellId={"dot4"} isOn={cells.dot4} onClick={onClick} />
      <Dot cellId={"dot5"} isOn={cells.dot5} onClick={onClick} />
      <Dot cellId={"dot6"} isOn={cells.dot6} onClick={onClick} />
    </div>
  );
};

type DotProps = {
  cellId: keyof CellType;
  isOn: boolean;
  className?: string;
  onClick: (dot: keyof CellType) => void;
};

const Dot = styled(({ cellId, isOn, className, onClick }: DotProps) => {
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

const Board = () => (
  <div>
    <h2> A braille cell</h2>
    <Cell />
  </div>
);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Board></Board>
      </header>
    </div>
  );
}

export default App;
