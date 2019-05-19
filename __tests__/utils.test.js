import { Log, assert, warn } from '../lib/Utils';

xdescribe('Log', () => {
  const spy = jest.spyOn(global.console, 'log');
  const text = 'Log test';

  afterEach(() => {
    spy.mockClear();
  });

  describe('when the NODE_ENV is development', () => {
    test('logs the text in the console', () => {
      const expected = `[Pulse] - ${text}`;

      process.env.NODE_ENV = 'development';
      Log(text);

      expect(spy).toBeCalledWith(expected);
    });
  });

  describe('when the NODE_ENV is not development', () => {
    test('does not log the text in the console', () => {
      process.env.NODE_ENV = 'production';
      Log(text);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe('assert', () => {
  const spy = jest.spyOn(global.console, 'warn');
  const message = 'Assert test';

  afterEach(() => {
    spy.mockClear();
  });

  describe('when the NODE_ENV is development', () => {
    test('warns the message in the console', () => {
      const expected = `[Pulse] - ${message}`;

      process.env.NODE_ENV = 'development';
      assert(message);

      expect(spy).toBeCalledWith(expected);
    });
  });

  describe('when the NODE_ENV is not development', () => {
    test('does not warn the message in the console', () => {
      process.env.NODE_ENV = 'production';
      assert(message);

      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe('warn', () => {
  const spy = jest.spyOn(global.console, 'error');
  const message = 'Warn test';

  test('it errors the message in the console', () => {
    const expected = `[Pulse] - ${message}`;

    warn(message);

    expect(spy).toBeCalledWith(expected);
  });
});
