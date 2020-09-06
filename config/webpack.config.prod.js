const base = require('../webpack.config');
const dts = require('dts-bundle-webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  ...base('prod'),
  name: 'build',
  mode: 'production',
  devtool: 'hidden-source-map',
  entry: {
    index: './lib/index.ts',
    next: './lib/next'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true
        }
      })
    ]
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
