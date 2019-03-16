module.exports =
  process.env.NODE_ENV === 'production'
    ? require('./dist/pulse.min.js')
    : require('./lib');
