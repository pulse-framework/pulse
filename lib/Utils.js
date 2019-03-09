module.exports = {
  Log: text => {
    const env = process.env.NODE_ENV;
    if (env === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[Pulse] - ${text}`);
    }
  },

  assert: message => {
    const env = process.env.NODE_ENV;
    if (env === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`[Pulse] - ${message}`);
    }
  },

  warn: message => {
    console.error(`[Pulse] - ${message}`);
  }
};
