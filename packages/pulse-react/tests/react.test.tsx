import * as React from 'react';
import Pulse, { State, usePulse } from '../lib';
import * as renderer from 'react-test-renderer';

let //
  App: Pulse,
  StringState: State<string>,
  BooleanState: State<boolean>, // TODO: use this somewhere, anywhere!
  TestComponent: React.FC<{}>;

const TestString = 'This is a string! Wow, so glorious!';

beforeAll(() => {
  App = new Pulse({ noCore: true });
});

describe('usePulse() | Typings', () => {
  beforeEach(() => {
    StringState = App.State(TestString);
    BooleanState = App.State(false);
  });

  test('State typings', () => {
    TestComponent = () => {
      const [myStringDestructured] = usePulse([StringState]);
      const myStringSingle = usePulse(StringState);
      const myHookArray: [string] = usePulse([StringState]);

      expect(typeof myStringDestructured).toBe('string');
      expect(myStringDestructured.length > 1).toBeTruthy();

      expect(typeof myStringSingle).toBe('string');
      expect(myStringSingle.length > 1).toBeTruthy();

      expect(myHookArray).toHaveLength(1);
      expect(typeof myHookArray).toBe('object');
      expect(typeof myHookArray[0]).toBe('string');

      return (
        <div>
          <p>{myStringSingle}</p>
          <p>{myStringDestructured}</p>
          <p>{myHookArray[0]}</p>
        </div>
      );
    };

    const testRender = renderer.create(<TestComponent />);
    let tree = testRender.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
