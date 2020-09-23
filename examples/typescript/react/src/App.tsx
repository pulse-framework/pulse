import React from 'react';
import logo from './logo.svg';
import './App.css';

import Pulse, { usePulse, useWatcher } from '@pulsejs/react';
import { resetState } from '@pulsejs/core';

import core from 'pulse-example-core';

// const App = new Pulse();

// const JEFF = App.State(0);

// JEFF.interval(val => ++val);

// const core = App.Core({ JEFF });

//@ts-ignore
globalThis['core'] = core;
//@ts-ignore
globalThis['resetState'] = resetState;

function MyApp() {
  const jeff = usePulse(core.accounts.ACCOUNT);

  useWatcher(core.accounts.state.SESSION_TOKEN, () => {
    console.log('token changed!');
  });

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          {JSON.stringify(jeff)}
        </a>
      </header>
    </div>
  );
}

export default MyApp;
