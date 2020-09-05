import 'mocha';
import { expect } from 'chai';
import Pulse, { Computed, State } from '../../dist';

const generateState = (App: Pulse) => ({
  string: App.State('initial value'),
  boolean: App.State(false),
  number: App.State(1000)
});

const generateComputed = (App: Pulse, state) => ({
  STRING: App.Computed(() => state.string.value, [state.string]),
  BOOLEAN: App.Computed(() => state.boolean.value, [state.boolean]),
  NUMBER: App.Computed(() => state.number.value, [state.number])
});

const basicTests = (computed: { [key: string]: Computed }, state: { [key: string]: State }) => {
  it('is both State and Computed', () => {
    for (const stateValue of Object.values(computed)) {
      expect(stateValue instanceof State).to.eq(true);
      expect(stateValue instanceof Computed).to.eq(true);
    }
  });
};

describe('coreless Computed functionality', () => {
  const App = new Pulse({
    noCore: true
  });

  const state = generateState(App);
  const computed = generateComputed(App, state);

  basicTests(computed, state);

  it('has correct initial value', () => {
    expect(computed.STRING.value).to.eq('initial value');
    expect(computed.BOOLEAN.value).to.eq(false);
    expect(computed.NUMBER.value).to.eq(1000);
  });

  it('recomputes upon dependency change', () => {
    state.string.set('changed value');
    expect(computed.STRING.value).to.eq('changed value');

    state.number.set(5000);
    expect(computed.NUMBER.value).to.eq(5000);
  });
});

describe('coreful Computed functionality', () => {
  const App = new Pulse({});

  const state = generateState(App);
  const computed = generateComputed(App, state);

  basicTests(computed, state);

  it('has no initial value', () => {
    expect(computed.STRING.value).to.eq(null);
    expect(computed.BOOLEAN.value).to.eq(null);
    expect(computed.NUMBER.value).to.eq(null);
  });

  it('computes upon Core initialization', () => {
    const core = App.Core({});

    expect(computed.STRING.value).to.eq('initial value');
    expect(computed.BOOLEAN.value).to.eq(false);
    expect(computed.NUMBER.value).to.eq(1000);
  });

  it('recomputes upon dependency change', () => {
    state.string.set('changed value');
    expect(computed.STRING.value).to.eq('changed value');

    state.number.set(5000);
    expect(computed.NUMBER.value).to.eq(5000);
  });

  // it('resets value properly', () => {
  //   expect(computed.STRING.value).to.eq('initial value');
  //   expect(computed.BOOLEAN.value).to.eq(false);
  //   expect(computed.NUMBER.value).to.eq(1000);
  // });
});
