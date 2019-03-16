const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    app: './lib/index.js'
  },
  plugins: [new CleanWebpackPlugin()],
  output: {
    filename: 'pulse.js',
    path: path.resolve(__dirname, 'dist')
  }
};
