import Pulse, { Computed, State, state } from '../lib';

let //
  App: Pulse,
  NumberState: State<number>,
  ComputedNumber: Computed<number>;

beforeEach(() => {
  NumberState = state(1);
  ComputedNumber = state<number>(() => NumberState.value + 2);
});

describe('Computed State', () => {
  describe('.value | Check that computation occurred properly', () => {
    test('Computed State can be initializes successfully', () => {
      //Verify state was created and can be retrieved
      expect(ComputedNumber.value).toBe(3);
    });

    test('Computed State auto recomputes', () => {
      //Mutate number state to (2)
      NumberState.set(2);
      //Verify state was created and can be retrieved
      expect(ComputedNumber.value).toBe(4);
    });
  });
});
