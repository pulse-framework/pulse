import 'mocha';
import { expect } from 'chai';
import Pulse, { Computed, State } from '../../lib/index';

const generateState = (App: Pulse) => ({
  string: App.State('initial value'),
  boolean: App.State(false),
  number: App.State(1000)
});
