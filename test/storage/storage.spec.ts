import 'mocha';
import { expect } from 'chai';
import Pulse from '../../lib/index';
import 'mock-local-storage';
import { MockAsyncStorage } from './mockStorage';

const AsyncStorage = new MockAsyncStorage();
// const LocalStorage = new MockLocalStorage();

// This function creates and instance of pulse with some persisted state
function createLocalStorageTestInstance() {
  const App = new Pulse();
  const PersistedState = App.State(1).persist('persisted_state');
  return App.Core({ PersistedState, App });
}

function createAsyncStorageTestInstance() {
  const App = new Pulse();
  const PersistedState = App.State(1).persist('persisted_state');
  App.Storage({
    async: true,
    type: 'custom',
    get: AsyncStorage.getItem.bind(AsyncStorage),
    set: AsyncStorage.setItem.bind(AsyncStorage),
    remove: AsyncStorage.removeItem.bind(AsyncStorage)
  });

  return App.Core({ PersistedState, App });
}

describe('synchronous storage', function () {
  // create initial instance of Pulse with persisted State and change the value.
  createLocalStorageTestInstance().PersistedState.set(2);
  // create a new instance of Pulse so we can see if it loaded persisted value the first instance established, this simulates a page reload
  const core = createLocalStorageTestInstance();

  it('local storage works with persist', function () {
    // is the value equal
    expect(core.PersistedState.value).to.be.equal(2);
    // expect(window.localStorage.getItem('_pulse_persisted_state')).to.be.equal('2');
    // core.PersistedState.set(3);
    // expect(window.localStorage.getItem('_pulse_persisted_state')).to.be.equal('3');
  });
});

describe('asynchronous storage', function () {
  // create initial instance of Pulse with persisted State and change the value.
  createAsyncStorageTestInstance().PersistedState.set(2);
  // create a new instance of Pulse so we can see if it loaded persisted value the first instance established, this simulates a page reload
  const core = createAsyncStorageTestInstance();

  it('async storage works with persist', function () {
    expect(core.App.storage.config.async).to.be.equal(true);
    expect(core.PersistedState.value).to.be.equal(2);
  });
});
