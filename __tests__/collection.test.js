import Pulse from '../lib';
// import window from '../__mocks__/window';

// A fully structured instance of Pulse with correct data
const library = {
  collections: {
    exampleOne: {
      data: {
        trueTest: true,
        falseTest: false,
        arrayTest: [1, 2, 3, 4, 5],
        objectTest: {
          haha: true
        },
        integerTest: 1995
      },
      persist: [
        'trueTest',
        'falseTest',
        'arrayTest',
        'objectTest',
        'integerTest'
      ],
      filters: {},
      actions: {}
    },
    exampleTwo: {}
  }
};

test('Collections initalized', () => {
  const pulse = new Pulse.Library(library);
  const exec = () => {
    if (!pulse._collections.hasOwnProperty('exampleOne')) return false;
    if (!pulse._collections.hasOwnProperty('exampleTwo')) return false;
    if (!pulse.hasOwnProperty('exampleOne')) return false;
    if (!pulse.hasOwnProperty('exampleTwo')) return false;
    return true;
  };
  expect(exec()).toBe(true);
});

test('data is mutable', () => {
  const pulse = new Pulse.Library(library);
  const exec = () => {
    pulse.exampleOne.trueTest = 'hi';

    if (pulse.exampleOne.trueTest !== 'hi') return false;
    // if (pulse.exampleOne.data.trueTest !== 'hi') return false;
    setTimeout(() => {
      console.log(pulse._collections.exampleOne.data);
    });
    return true;
  };
  expect(exec()).toBe(true);
});
