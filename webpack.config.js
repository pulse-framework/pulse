const path = require('path');

const tsConfigPaths = {
  base: path.resolve(__dirname, 'tsconfig.json'),
  dev: path.resolve(__dirname, 'config/tsconfig.dev.json'),
  prod: path.resolve(__dirname, 'config/tsconfig.prod.json')
};

/**
 *
 * @param {keyof typeof tsConfigPaths} tsConfigLocation
 */
module.exports = tsConfigLocation => ({
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs-module'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts.?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              context: path.resolve(__dirname, 'config'),
              configFile: tsConfigPaths[tsConfigLocation]
            }
          }
        ]
      }
    ]
  }
});
