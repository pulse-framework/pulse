import Pulse, { State } from '../lib';

import { Days } from './util.test';

let //
  App: Pulse,
  BooleanState: State<boolean>,
  StringState: State<string>,
  ObjectState: State<{ days: Days }>,
  NullState: State<null | boolean>;

beforeAll(() => {
  App = new Pulse({ noCore: true });
});

beforeEach(() => {
  BooleanState = App.State(true);
  StringState = App.State('Hello Pulse!');
  ObjectState = App.State({ days: { monday: true, wednesday: true } });
  NullState = App.State(null);
});

//.value | Provides the current value (read-only)

test('State can be created and retrieved', () => {
  //Verify state was created and can be retrieved
  expect(BooleanState.value).toBeTruthy();
});

//.set() | Allows you to mutate a value

test('State can be changed', () => {
  //Mutate state to (false)
  BooleanState.set(false);
  //Verify previous state mutation successfully occurred
  expect(BooleanState.value).toBeFalsy();
});

//.undo() | Revert to previous state

test('State change can be undone', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Undo previous state mutation
  StringState.undo();
  //Verify previous mutation has been undone successfully
  expect(StringState.value).toBe('Hello Pulse!');
});

//.previousState | Returns the previous state

test('Previous State can be retrieved', () => {
  //Set state key to ('Bye Pulse!')
  StringState.set('Bye Pulse!');
  //Verify that previousState can be accessed
  expect(StringState.previousState).toBe('Hello Pulse!');
});

//.bind | Assign new value to state

test('New value can be bound to state', () => {
  //Bind new value to StringState (Bye Pulse!)
  StringState.bind = 'Bye Pulse!';
  //Verify that the new string has been successfully bound
  expect(StringState.value).toBe('Bye Pulse!');
});

//.type() | Force State to only allow mutations of provided type

test('Previous State can be retrieved', () => {
  //Set state type to boolean
  NullState.type(Boolean);
  //Give state false value
  NullState.set(false);
  //Verify that state's type and value has successfully changed
  expect(NullState.value).toBeFalsy();
});

//.key() | Provide a name (or key) to identify the state, required for SSR and persisting
//.name() | The name of the state, can be set directly or using above key()

test('State key can be set and name can be retrieved', () => {
  //Set state key to (StringState)
  StringState.key('StringStateKey');
  //Verify that state key has been successfully set
  expect(StringState.name).toBe('StringStateKey');
});

//.persist() | Will preserve state in the appropriate local storage for the environment (web / mobile)

//// WIP

//.exists | Returns truthiness of the current value

test("State doesn't exist test", () => {
  //Mutate state to (null)
  StringState.set(null);
  //Verify that state doesn't exists
  expect(StringState.exists).toBeFalsy();
});

test('Can get if state exists', () => {
  //Mutate state to (Hello Pulse!)
  StringState.set('Hello Pulse!');
  //Verify that state exists
  expect(StringState.exists).toBeTruthy();
});

//.is() | Equivalent to ===

test('Is function equality', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Check if string has been successfully mutated and if equality check is successful
  expect(StringState.is('Bye Pulse!')).toBeTruthy();
});

//.isNot() | Equivalent to !==

test('IsNot function equality', () => {
  //Mutate state to (Hello Pulse!)
  StringState.set('Hello Pulse!');
  //Check if string is not null
  expect(StringState.isNot(null)).toBeTruthy();
});

//.initialState | The starting value as established in code

test('Can get initial state', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Check if initial state retrieves correct value (Hello Pulse!)
  expect(StringState.initialState).toBe('Hello Pulse!');
});

//.onNext() | A callback that fires on the next mutation, then destroys itself

test('onNext callback fires after mutation', () => {
  let nextCallback = false;

  //Adds callback that fires upon next mutation
  StringState.onNext(() => {
    nextCallback = true;
  });
  //State mutation causing onNext to fire
  StringState.set('Bye Pulse!');

  //nextCallback should be true after onNext fires
  expect(nextCallback).toBeTruthy();
});

//.patch() | A function to edit ("patch") deep properties of an object, provided the State value is an object

test('Deep merge patch', () => {
  //Patch in saturday date with deep option for deep merge
  ObjectState.patch({ days: { saturday: true } }, { deep: true });
  //Expect monday, wednesday, and saturday because deep merge leaves the other properties
  expect(ObjectState.value.days).toStrictEqual({
    monday: true,
    wednesday: true,
    saturday: true
  });
});

test('Shallow merge patch', () => {
  //Patch in saturday date without deep option for deep merge
  ObjectState.patch({ days: { saturday: true } }, { deep: false });
  //Expect just saturday because shallow merge removes other dates
  expect(ObjectState.value.days).toStrictEqual({
    saturday: true
  });
});

//.watch() | A keyed callback that will fire every mutation, provides current value in as first param in callback

test('Watch callback gets fired after mutation', () => {
  let didWatchCallback = false;

  //Adds keyed callback that fires upon mutation
  StringState.watch('StringState', () => {
    didWatchCallback = true;
  });
  //Sets StringState state, forcing keyed callback to fire (if still watching)
  StringState.set('Bye Pulse!');

  //Should be true due to callback setting (didWatchCallback) to true
  expect(didWatchCallback).toBeTruthy();
});

//.removeWatcher() | Remove a watcher by key

test('Watch callback gets fired after mutation', () => {
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

//.relate()

//// WIP

//.reset() | Reset state to initial value

test('Can reset to initial state', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Reset state to initial value (Hello Pulse!)
  StringState.reset();
  //Should be initial value (Hello Pulse!) assuming reset successfully ran
  expect(StringState.value).toBe('Hello Pulse!');
});

//.toggle() | If current value is a boolean, this will invert it

test('Can invert boolean values', () => {
  //Mutate state to (true)
  BooleanState.set(true);
  //Invert boolean value from (true) to (false)
  BooleanState.toggle();
  //Should be (false) assuming inversion successfully occurred
  expect(BooleanState.value).toBeFalsy();
});

//.interval() | A mutation callback fired on a self contained interval

test('Interval callback can successfully fire', () => {
  //Enable fake timers to work with intervals
  jest.useFakeTimers();
  //Set callback function to record how many times the function has been called
  const callback = jest.fn();
  //Set string state interval to run every second
  StringState.interval(() => {
    callback();
  }, 1000);
  //Fast forward string state interval timer 10 seconds
  jest.advanceTimersByTime(10000);
  //The callback function should have been called 10 times
  expect(callback).toHaveBeenCalledTimes(10);
});
