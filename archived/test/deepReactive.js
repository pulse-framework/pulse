const Pulse = require('../dist/pulse.js');
const assert = require('assert');
const { expect } = require('chai');
console.clear();

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
const getDep = pulse._private.global.getDep;
