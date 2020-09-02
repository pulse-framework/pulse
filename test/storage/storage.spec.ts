import 'mocha';
import { expect } from 'chai';
import Pulse from '../../lib/index';
import 'mock-local-storage';

// import MockAsyncStorage from 'mock-async-storage';
// const mockImpl = new MockAsyncStorage();

// This function creates and instance of pulse with some persisted state
function createLocalStorageTestInstance() {
  const App = new Pulse();
  const PersistedState = App.State(1).persist('persisted_state');
  return App.Core({ PersistedState, App });
}

// App.Storage({
//   get: AsyncStorage.getItem,
//   set: AsyncStorage.setItem,
//   remove: AsyncStorage.removeItem
// });

describe('synchronous storage', () => {
  // create initial instance of Pulse with persisted State and change the value.
  createLocalStorageTestInstance().PersistedState.set(2);
  // create a new instance of Pulse so we can see if it loaded persisted value the first instance established, this simulates a page reload
  const core = createLocalStorageTestInstance();

  it('local storage should work with persist', () => {
    // is the value equal
    expect(core.PersistedState.value).to.be.equal(2);
    expect(window.localStorage.getItem('_pulse_persisted_state')).to.be.equal('2');
    core.PersistedState.set(3);
    expect(window.localStorage.getItem('_pulse_persisted_state')).to.be.equal('3');
  });
});
