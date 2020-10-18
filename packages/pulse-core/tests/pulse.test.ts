import Pulse from '../lib';

let App: Pulse;

beforeAll(() => {
  App = new Pulse({ noCore: true });
});

describe('Pulse Generic', () => {
  test('Pulse instance is created', () => {
    expect(App).toHaveProperty('runtime');
  });
});
