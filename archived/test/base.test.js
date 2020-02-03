const Pulse = require('../dist/pulse.js');
const assert = require('assert');
const { expect } = require('chai');

describe('Pulse Basic Environment', function() {
  const pulse = new Pulse();

  it('"_private" should be present on the instance', () =>
    expect(typeof pulse._private).to.be.equal('object'));

  it('Modules should be initialized', () => {
    expect(typeof pulse._private.collections).to.be.equal('object');
    expect(typeof pulse._private.modules).to.be.equal('object');
    expect(typeof pulse._private.services).to.be.equal('object');
  });
});
