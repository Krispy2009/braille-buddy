import "./App.css";
import { Board } from "./components/Board/Board";
import { ThemeSwitcher } from "./components/ThemeSwitcher/ThemeSwitcher";

function App() {
  return (
    <main className="App">
      <ThemeSwitcher />
      <h1>Braille Buddy</h1>
      <p className="intro">Raise dots to see which letter they make.</p>
      <Board />
    </main>
  );
}

export default App;
