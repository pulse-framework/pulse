const Pulse = require('../dist/pulse.min.js');
const assert = require('assert');
const { expect } = require('chai');
console.clear();
// mockup Pulse config for this test
const pulse = new Pulse({
  config: {
    framework: 'react'
  },
  collections: {
    example: {
      data: {
        thing: true,
        thing2: 'haha'
      }
    },
    example2: {
      data: {
        thing: true,
        thing2: 'haha',
        deep: {
          haha: true
        }
      }
    }
  }
});

// replicate the basic functionality of a react component, with internal history state change history for debugging
class fakeComponent {
  constructor() {
    this.history = [];
  }
  setState(objectOfProperties = {}) {
    Object.keys(objectOfProperties).forEach(property => {
      this.history.push({
        timestamp: new Date(),
        property,
        value: objectOfProperties[property]
      });
      this[property] = objectOfProperties[property];
    });
  }
}

const f0 = new fakeComponent();

describe('Basic mapData() init & subscribe', () => {
  it('Can map data to component', () => {
    pulse.mapData(({ example }) => {
      return {
        thing: example.thing
      };
    }, f0);
    // make sure component store has one component instance inside
    expect(
      Object.keys(pulse._private.global.subs.componentStore).length
    ).to.be.equal(1);
  });
  it('Has created dependency on collection data property', () => {
    const dep = pulse._private.global.getDep('thing', 'example');
    expect(dep.subscribers.length).to.be.equal(1);
  });
});

describe('basic mapData() with several properties', () => {
  it('Can map multiple data properties to component', () => {
    const f1 = new fakeComponent();
    const f2 = new fakeComponent();

    // mockup mapping data to fake component
    f1.setState({
      ...pulse.mapData(({ example, example2 }) => {
        return {
          thing: example.thing,
          thing2: example2.thing
        };
      }, f1)
    });

    // mockup mapping data to fake component
    f2.setState({
      ...pulse.mapData(({ example, example2 }) => {
        return {
          thing: example.thing,
          thing2: example2.thing
        };
      }, f2)
    });
  });

  it('Has created dependency on collection data properties', () => {
    // get the dependencies for each data properties
    const dep1 = pulse._private.global.getDep('thing', 'example');
    const dep2 = pulse._private.global.getDep('thing2', 'example');
    const dep3 = pulse._private.global.getDep('thing', 'example2');
    const dep4 = pulse._private.global.getDep('thing2', 'example2');
    // first example is used in the first test, and in this test twice, thus should be 3
    expect(dep1.subscribers.length).to.be.equal(3);
    // this example is never used
    expect(dep2.subscribers.length).to.be.equal(0);
    // this example is used in this test twice
    expect(dep3.subscribers.length).to.be.equal(2);
    // this example is never used
    expect(dep4.subscribers.length).to.be.equal(0);
  });
});

describe('Updating subscribers for mutations', () => {
  it('Single mutation will update subscribers', done => {
    pulse.example.thing = 'newValue';
    setTimeout(() => {
      expect(f0.thing).to.be.equal('newValue');
      done();
    });
  });
  it('Many mutations will update many subscribers', done => {
    const f3 = new fakeComponent();

    f3.setState({
      ...pulse.mapData(({ example, example2 }) => {
        return {
          thing1: example.thing,
          thing2: example.thing2,
          thing3: example2.thing,
          thing4: example2.thing2
        };
      }, f3)
    });

    // first change a bunch of data
    pulse.example.thing = 'newValue1';
    pulse.example.thing2 = 'newValue2';
    pulse.example2.thing = 'newValue3';
    pulse.example2.thing2 = 'newValue4';

    setTimeout(() => {
      expect(f3.thing1).to.be.equal('newValue1');
      expect(f3.thing2).to.be.equal('newValue2');
      expect(f3.thing3).to.be.equal('newValue3');
      expect(f3.thing4).to.be.equal('newValue4');
      done();
    });
  });
});

describe('Map data with deep reactive properties', () => {
  it('Map deep properties to component', () => {
    // ensure values are what we expect
    pulse.example.thing = 'deep1';
    pulse.example.thing2 = 'deep2';
    // create fake component
    const f4 = new fakeComponent();
    // map data with deep property
    f4.setState({
      ...pulse.mapData(({ example, example2 }) => {
        return {
          deepThing: example.thing,
          deepHaha: example2.deep.haha,
          deepThing2: example.thing2
        };
      }, f4)
    });
  });
  it('Regular property before deep reactive is present.', done => {
    setTimeout(() => {
      // check that the property has the subscribers
      expect(
        typeof pulse._private.global
          .getDep('thing', 'example')
          .subscribers.find(x => x.key === 'deepThing')
      ).to.be.equal('object');
      done();
    });
  });
  it('Regular property before deep reactive is present.', done => {
    setTimeout(() => {
      // check that the property has the subscribers
      expect(
        typeof pulse._private.global
          .getDep(pulse.example2.thing)
          .subscribers.find(x => x.key === 'deepThing')
      ).to.be.equal('object');
      done();
    });
  });
});
