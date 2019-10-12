const Pulse = require('../dist/pulse.min.js');
const assert = require('assert');
const { expect } = require('chai');

describe('Pulse Basic Environment', function() {
  const pulse = new Pulse();

  it('"_private" should be present on the instance', () =>
    expect(typeof pulse._private).to.be.equal('object'));

  it('Collections should be initialized', () =>
    expect(typeof pulse._private.collections).to.be.equal('object'));
});
