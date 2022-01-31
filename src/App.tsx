import React from 'react';
import styled from 'styled-components';
import './App.css';


type CellType = {dot1: boolean, dot2: boolean, dot3: boolean, dot4: boolean, dot5:boolean, dot6:boolean}

const Cell : React.FC = () => {

  const [cells, setCells] = React.useState({dot1: false, dot2: false, dot3: false, dot4: false, dot5: false, dot6:false})

  const onClick = (dot : number) => {
    const newCells : CellType = {...cells}
    const dotIdx: string =  `dot${dot}`
    newCells[dotIdx] = !cells[dotIdx]
    setCells(newCells)
  }

  return <div className="cell">
  <Dot cellId={1} isOn= {cells.dot1}/>
  <Dot cellId={2} isOn= {cells.dot2}/>
  <Dot cellId={3} isOn= {cells.dot3}/>
  <Dot cellId={4} isOn= {cells.dot4}/>
  <Dot cellId={5} isOn= {cells.dot5}/>
  <Dot cellId={6} isOn= {cells.dot6}/>
  </div>
}


type DotProps = {cellId: number, isOn: boolean,  className?: string, }

const Dot = styled(({cellId, isOn, className, }: DotProps) => {
 const [checked, setchecked] = React.useState(isOn);



  return <span onClick={onClick} className={className} style={{backgroundColor: `${checked? 'black' : 'white'}`}}>{cellId}</span>
})`
    border: 1px solid black;
    border-radius: 40px;
    padding: 4px 10px;`



const  Board = () =>  <div>
  <h2> A braille cell</h2>
  <Cell/>

</div>



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
