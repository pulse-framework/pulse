const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const { version } = require('../package.json');

module.exports = {
  entry: {
    app: './lib/index.js'
  },
  plugins: [new CleanWebpackPlugin(), new webpack.DefinePlugin({
    '__VERSION__': JSON.stringify(version)
  })],
  output: {
    filename: 'pulse.min.js',
    library: '',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, '../dist')
  }
};
