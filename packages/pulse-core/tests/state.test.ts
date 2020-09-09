import Pulse from '../lib';

const App = new Pulse();
const MyState = App.State(true);

test('State can be created', () => {
  expect(MyState.value).toBe(true);
});
