const path = require('path');
const dts = require('dts-bundle-webpack');

const baseConfig = {
  output: {
    path: path.resolve(__dirname, './dist'),
    library: 'pulse-framework',
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        options: {
          configFile: './config/tsconfig.prod.json'
        }
      }
    ]
  }
};

// uses master ts config
const buildConfig = {
  ...baseConfig,
  name: 'build',
  mode: 'production',
  devtool: 'inline-source-map',
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

// this will use a custom tsconfig
const devConfig = {
  ...baseConfig,
  name: 'dev',
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    index: './lib/index.ts',
    next: './lib/next'
  },
  plugins: []
};
// custom ts config location
devConfig.module.rules[0].options.configFile = './config/tsconfig.dev.json';

module.exports = [buildConfig, devConfig];
