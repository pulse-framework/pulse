import { instance } from '../lib';

describe('Pulse Generic', () => {
  test('Pulse instance is created', () => {
    expect(instance).toHaveProperty('runtime');
  });
});
