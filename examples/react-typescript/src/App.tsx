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
  // usePulse to subscribe to Pulse state
  const [dark, time, duration] = usePulse([
    Core.state.DARK_THEME,
    Core.state.THE_TIME,
    Core.state.SESSION_DURATION
  ]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Pulse X React
        </a>
        <p>{JSON.stringify(cleanState(time))}</p>
        <p className="small-text">{JSON.stringify(cleanState(duration))}</p>
      </header>
    </div>
  );
};

export default App;
