const base = require('../webpack.config');

module.exports = {
  ...base('dev'),
  name: 'dev',
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,
  entry: {
    index: { import: './lib/index' },
    next: { import: './lib/next', dependOn: 'index' }
  }
};
