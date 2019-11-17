const Pulse = require('../dist/pulse.min.js');
const assert = require('assert');
const {expect} = require('chai');

describe('Pulse Basic Environment', function() {
  const pulse = new Pulse({
    actions: {
      haha({debounce}) {
        console.log('OUTSIDE debounce');
        return debounce(() => {
          console.log('inside debounce');
        }, 500);
      }
    }
  });

  it('c', () => expect(typeof pulse._private).to.be.equal('object'));
});
