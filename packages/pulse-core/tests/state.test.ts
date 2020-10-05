import Pulse from '../lib';

const App = new Pulse();
const BooleanState = App.State<boolean>(true);
const StringState = App.State<string>('Hello Pulse!');

//.value | Retrieve current value

test('State can be created and retrieved', () => {
  //Verify state was created and can be retrieved
  expect(BooleanState.value).toBeTruthy();
});

//.set() | Update state to passed value

test('State can be changed', () => {
  //Mutate state to (false)
  BooleanState.set(false);
  //Verify previous state mutation successfully occurred
  expect(BooleanState.value).toBeFalsy();
});

//.undo() | Revert back to previous state

test('State change can be undone', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Undo previous state mutation
  StringState.undo();
  //Verify previous mutation has been undone
  expect(StringState.value).toBe('Hello Pulse!');
});

//.previousState | Retrieve previous state

test('Previous State can be retrieved', () => {
  //Set state key to ('Bye Pulse!')
  StringState.set('Bye Pulse!');
  //Verify that previousState can be accessed (Hello Pulse!)
  expect(StringState.previousState).toBe('Hello Pulse!');
});

//.key() | Set state key

test('State key can be set and name can be retrieved', () => {
  //Set state key to (StringState)
  StringState.key('StringState');
  //Verify that state key has been successfully set
  expect(StringState.name).toBe('StringState');
});

//.bind | Assign new value to state

test('New value can be bound to state', () => {
  //Bind new value to StringState (Bye Pulse!)
  StringState.bind = 'Bye Pulse!';
  //Verify that the new string has been successfully bound
  expect(StringState.value).toBe('Bye Pulse!');
});

//.persist() | test

////
////

//.exists | State doesn't exist test

test("State doesn't exist test", () => {
  //Mutate state to (null)
  StringState.set(null);
  //Verify that state doesn't exists
  expect(StringState.exists).toBeFalsy();
});

//.exists | State does exist test

test('Can get if state exists', () => {
  //Mutate state to (Hello Pulse!)
  StringState.set('Hello Pulse!');
  //Verify that state exists
  expect(StringState.exists).toBeTruthy();
});

//.is() | Test for equality

test('Is function equality', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Check if string has been successfully mutated and if equality check is successful
  expect(StringState.is('Bye Pulse!')).toBeTruthy();
});

//.isNot() | Test for inequality

test('IsNot function equality', () => {
  //Mutate state to (Hello Pulse!)
  StringState.set('Hello Pulse!');
  //Check if string is not null
  expect(StringState.isNot(null)).toBeTruthy();
});

//.initialState | Get state initial value

test('Can get initial state', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Check if initial state retrieves correct value (Hello Pulse!)
  expect(StringState.initialState).toBe('Hello Pulse!');
});

//.onNext() | Callback that fires after mutation

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

////
////

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

////
////

//.reset()

test('Can reset to initial state', () => {
  //Mutate state to (Bye Pulse!)
  StringState.set('Bye Pulse!');
  //Reset state to initial value (Hello Pulse!)
  StringState.reset();
  //Should be initial value (Hello Pulse!) assuming reset successfully ran
  expect(StringState.value).toBe('Hello Pulse!');
});

//.toggle()

test('Can invert boolean values', () => {
  //Mutate state to (true)
  BooleanState.set(true);
  //Invert boolean value from (true) to (false)
  BooleanState.toggle();
  //Should be (false) assuming inversion successfully occurred
  expect(BooleanState.value).toBeFalsy();
});

//.interval()

////
////
