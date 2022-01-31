import React, { ReactElement } from 'react';
import logo from './logo.svg';
import './App.css';

type DotProps = {cellId: number, isOn: boolean}
const Dot = ({cellId, isOn}: DotProps): ReactElement => {
  return <span className={isOn ? 'on' : 'off'}>{cellId}</span>
}

const  Board = () =>  <div>
  <h2> This is your board</h2>
  <div>
  <Dot cellId={1} isOn= {false}/>
  <Dot cellId={2} isOn= {false}/>
  <Dot cellId={3} isOn= {false}/>
  <Dot cellId={4} isOn= {false}/>
  <Dot cellId={5} isOn= {false}/>
  <Dot cellId={6} isOn= {false}/>
  </div>

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
