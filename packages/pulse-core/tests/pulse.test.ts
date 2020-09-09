import Pulse from '../lib';

const App = new Pulse();

test('Pulse instance is created', () => {
  expect(App).toHaveProperty('runtime');
});
