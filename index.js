// module.exports = require('./dist/pulse.min.js');

module.exports =
  process.env.NODE_ENV === 'production'
    ? require('./dist/pulse.js')
    : require('./dist/pulse.js');
