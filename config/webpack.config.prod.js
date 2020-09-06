const base = require('../webpack.config');
const path = require('path');
const dts = require('dts-bundle-webpack');

module.exports = {
  ...base('prod'),
  name: 'build',
  mode: 'production',
  entry: {
    index: './lib/index.ts',
    next: './lib/next'
  },
  plugins: [
    new dts({
      name: 'pulse-framework',
      main: 'declarations/index.d.ts',
      out: '../dist/index.d.ts'
    }),
    new dts({
      name: 'pulse-framework/next',
      main: 'declarations/next/index.d.ts',
      out: '../../dist/next.d.ts'
    })
  ]
};
