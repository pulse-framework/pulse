import Pulse from '../lib';

const App = new Pulse({ noCore: true });
const NumberState = App.State<number>(1);
const ComputedState = App.Computed(() => NumberState.value + 2);

//.value | Check that computation occurred properly

test('Computed State can be successfully initialized', () => {
  //Verify state was created and can be retrieved
  expect(ComputedState.value).toBe(3);
});

//.value | Dependency mutation computation test

test('Number state can be changed and cause computed state to recompute', () => {
  //Mutate number state to (2)
  NumberState.set(2);
  //Verify state was created and can be retrieved
  expect(ComputedState.value).toBe(4);
});
