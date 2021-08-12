import Pulse, { State } from '../lib';
import { Days, DefaultLoggers, makeMockLoggers, restoreDefaultLoggers } from './util';

let //
  App: Pulse,
  BooleanState: State<boolean>,
  StringState: State<string>,
  ObjectState: State<{ days: Partial<Days> }>,
  NullState: State<null | boolean>;

const initialValue = {
  Boolean: true,
  String: 'Hello Pulse!',
  Object: { days: { monday: true, wednesday: true } },
  Null: null
};

beforeAll(() => {
  App = new Pulse({ noCore: true });
});

beforeEach(() => {
  makeMockLoggers();

  BooleanState = App.State(initialValue.Boolean);
  StringState = App.State(initialValue.String);
  ObjectState = App.State(initialValue.Object);
  NullState = App.State(initialValue.Null);
});

afterEach(() => {
  restoreDefaultLoggers();
});

describe('State', () => {
  test('.value | Provide current value', () => {
    // Verify state was created and can be retrieved
    expect(BooleanState.value).toBe(initialValue.Boolean);
    expect(StringState.value).toBe(initialValue.String);
    expect(ObjectState.value).toStrictEqual(initialValue.Object);
    expect(NullState.value).toBe(initialValue.Null);
  });

  test('.set() | Mutate value', () => {
    BooleanState.set(false);
    StringState.set('Hi again, Pulse!');
    ObjectState.set({ days: { monday: true, thursday: true, friday: true } });
    NullState.set(false);

    expect(BooleanState.value).toBe(false);
    expect(StringState.value).toBe('Hi again, Pulse!');
    expect(ObjectState.value).toStrictEqual({ days: { monday: true, thursday: true, friday: true } });
    expect(NullState.value).toBe(false);
  });

  test('.undo() | Revert to previous value', () => {
    StringState.set('Bye Pulse!');
    ObjectState.set({ days: { thursday: true } });

    StringState.undo();
    ObjectState.undo();

    expect(StringState.value).toBe(initialValue.String);
    expect(ObjectState.value).toStrictEqual(initialValue.Object);
  });

  test('.previousState | Return previous value', () => {
    StringState.set('Bye Pulse!');
    BooleanState.set(!initialValue.Boolean);

    expect(StringState.previousState).toBe(initialValue.String);
    expect(BooleanState.previousState).toBe(initialValue.Boolean);
  });

  test('.bind | Assign new value', () => {
    StringState.bind = 'Bye Pulse!';

    expect(StringState.value).toBe('Bye Pulse!');
  });

  test('.type() | Force State to only allow mutations of provided type', () => {
    NullState.type(Boolean).set(false);

    expect(NullState.value).toBeFalsy();

    const reset = jest.fn(() => {
      NullState.set(initialValue.Null);
    });
    reset();

    expect(console.warn).toBeCalledWith(expect.stringContaining('Incorrect type (object) was provided. Type fixed to boolean'));
  });

  test('.name + .key() | Provide key for State', () => {
    StringState.key('StringStateKeyWow');

    expect(StringState.name).toBe('StringStateKeyWow');
  });

  // TODO: .persist() | Will preserve state in the appropriate local storage for the environment (web / mobile)

  describe('.exists | Return truthiness of value', () => {
    test('null is falsy', () => {
      StringState.set(null);

      expect(StringState.exists).toBeFalsy();
    });

    test('string is truthy', () => {
      StringState.set('Hello Pulse!');

      expect(StringState.exists).toBeTruthy();
    });
  });

  describe('.is() | Has equivalent value', () => {
    test('match string', () => {
      StringState.set('Bye Pulse!');

      expect(StringState.is('Bye Pulse!')).toBeTruthy();
    });

    test('match boolean', () => {
      BooleanState.set(!BooleanState.value);

      expect(BooleanState.is(!initialValue.Boolean)).toBeTruthy();
    });

    test('do not match Object', () => {
      expect(ObjectState.is(initialValue.Object)).toBeFalsy();

      const test = { days: null };

      ObjectState.set(test);

      expect(StringState.is(test)).toBeFalsy();
    });
  });

  test('.isNot() | Has non-equivalent value', () => {
    StringState.set('Hi, and testing, Pulse!');

    expect(StringState.isNot('Hello Pulse!')).toBeTruthy();
    expect(StringState.isNot(null)).toBeTruthy();
  });

  test('.initialState | Retains initial value', () => {
    StringState.set('Bye Pulse!');

    expect(StringState.initialState).toBe(initialValue.String);
  });

  test('.onNext() | Fires upon mutation', () => {
    let nextCallback = false;

    StringState.onNext(() => {
      nextCallback = true;
    });
    // Mutate value, triggering onNext()
    StringState.set('Bye Pulse!');

    expect(nextCallback).toBeTruthy();
  });

  describe('.patch() | Merges values into existing object value', () => {
    test('deep merge', () => {
      ObjectState.patch({ days: { saturday: true } }, { deep: true });

      expect(ObjectState.value.days).toStrictEqual({
        saturday: true,
        ...initialValue.Object.days
      });
    });

    test('shallow merge', () => {
      ObjectState.patch({ days: { saturday: true } }, { deep: false });

      expect(ObjectState.value.days).toStrictEqual({
        saturday: true
      });
    });
  });

  describe('Watchers', () => {
    let didCallback: boolean;

    beforeEach(() => {
      didCallback = false;
    });

    test('.watch() | Fires upon mutation', () => {
      StringState.watch('StringState', () => {
        didCallback = true;
      });
      // Cause mutation & subsequent watch callback
      StringState.set('Bye Pulse!');

      expect(didCallback).toBeTruthy();
    });

    test('.removeWatcher() | Removes watcher', () => {
      let didWatchCallback = false;

      //Adds keyed callback that fires upon mutation
      StringState.watch('StringState', () => {
        didWatchCallback = true;
      });
      //Removes keyed callback from string state
      StringState.removeWatcher('StringState');
      //Sets StringState state, forcing keyed callback to fire (if still watching)
      StringState.set('Bye Pulse!');

      //Should be false due to keyed callback being removed and not firing
      expect(didWatchCallback).toBeFalsy();
    });
  });

  // TODO: .relate()

  test('.reset() | Reset state to initial value', () => {
    StringState.set('Bye Pulse!');
    StringState.reset();

    expect(StringState.value).toBe(initialValue.String);
  });

  test('.toggle() | Invert boolean value', () => {
    BooleanState.set(true);
    BooleanState.toggle();

    expect(BooleanState.value).toBeFalsy();
  });

  test('.interval() | A mutation callback fired on a self contained interval', () => {
    jest.useFakeTimers();
    const callback = jest.fn();

    StringState.interval(() => {
      callback();
    }, 1000); // Run callback once every second

    // Fast-forward StringState interval by 10 seconds
    jest.advanceTimersByTime(10000);

    expect(callback).toHaveBeenCalledTimes(10);
  });
});
