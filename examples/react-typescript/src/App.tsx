import React from 'react';
import logo from './assets/logo.svg';
import './App.css';
import { usePulse, cleanState } from 'pulse-framework';
import Core from './core';

interface Global {
  [key: string]: any; // Add index signature
}
(globalThis as Global).core = Core;

const App = () => {
  const [dark, time, duration] = usePulse([
    Core.state.DARK_THEME,
    Core.state.THE_TIME,
    Core.state.SESSION_DURATION
  ]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{JSON.stringify(dark.value)}</p>
        <p>{JSON.stringify(time.value)}</p>
        <p className="small-text">{JSON.stringify(cleanState(duration))}</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
};

export default App;
