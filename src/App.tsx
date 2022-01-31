import React from 'react';
import styled from 'styled-components';
import './App.css';


const Cell : React.FC = () => {
  return <div className="cell">
  <Dot cellId={1} isOn= {false}/>
  <Dot cellId={2} isOn= {false}/>
  <Dot cellId={3} isOn= {false}/>
  <Dot cellId={4} isOn= {false}/>
  <Dot cellId={5} isOn= {false}/>
  <Dot cellId={6} isOn= {false}/>
  </div>
}


type DotProps = {cellId: number, isOn: boolean,  className?: string, }

const Dot = styled(({cellId, isOn, className, }: DotProps) => {
 const [checked, setchecked] = React.useState(isOn);

  const onClick = () => {
    setchecked(!checked)
  }

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
