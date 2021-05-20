import React from 'react';
import logo from './logo.svg';
import './App.css';

import { usePulse } from '@pulsejs/react';
import { resetState } from '@pulsejs/core';

import core from 'pulse-example-core';

//@ts-ignore
globalThis['core'] = core;

function MyApp() {
  const jeff = usePulse(core.app.state.assetURL);

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
