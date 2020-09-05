const path = require('path');
const dts = require('dts-bundle-webpack');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    main: './lib/index.ts'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    library: 'pulse-framework',
    libraryTarget: 'umd',
    filename: 'index.js' // <--- Will be compiled to this single file
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader'
      }
    ]
  },
  plugins: [
    new dts({
      name: 'pulse-framework',
      main: 'build/index.d.ts',
      out: '../dist/index.d.ts'
    })
  ]
};
