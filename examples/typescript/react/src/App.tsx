import React from 'react';
import logo from './logo.svg';
import './App.css';
import Pulse, { usePulse } from '@pulsejs/react';

const App = new Pulse();

const JEFF = App.State(0);

JEFF.interval(val => {
  return (val + 1) * 2;
});

const core = App.Core({ JEFF });

//@ts-ignore
globalThis['core'] = core;

function MyApp() {
  const jeff = usePulse(JEFF);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          {jeff}
        </a>
      </header>
    </div>
  );
}

export default MyApp;
