const base = require('../webpack.config');

module.exports = {
  ...base('dev'),
  name: 'dev',
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    index: './lib/index.ts',
    next: './lib/next'
  },
  plugins: []
};
