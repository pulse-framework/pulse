import Pulse, { Computed, State } from '../lib';

let //
  App: Pulse,
  NumberState: State<number>,
  ComputedState: Computed<number>;

beforeAll(() => {
  App = new Pulse({ noCore: true });
});

beforeEach(() => {
  const NumberState = App.State<number>(1);
  const ComputedState = App.Computed(() => NumberState.value + 2);
});

describe('Computed State', () => {
  describe('.value | Check that computation occurred properly', () => {
    test('Computed State can be initializes successfully', () => {
      //Verify state was created and can be retrieved
      expect(ComputedState.value).toBe(3);
    });

    test('Computed State auto recomputes', () => {
      //Mutate number state to (2)
      NumberState.set(2);
      //Verify state was created and can be retrieved
      expect(ComputedState.value).toBe(4);
    });
  });
});
