const path = require('path');
const dts = require('dts-bundle-webpack');

const tsConfigPaths = {
  base: path.resolve(__dirname, 'tsconfig.json'),
  dev: path.resolve(__dirname, 'config/tsconfig.dev.json'),
  prod: path.resolve(__dirname, 'config/tsconfig.prod.json')
};

/**
 * Generate a configuration object
 * @param {'dev' | 'prod'} mode
 */
const getConfig = mode => {
  const baseConfig = {
    output: {
      path: path.resolve(__dirname, 'dist'),
      library: 'pulse-framework',
      libraryTarget: 'umd'
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
                configFile: mode === 'dev' ? tsConfigPaths.dev : tsConfigPaths.prod
              }
            }
          ]
        }
      ]
    }
  };

  if (mode === 'dev')
    return {
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

  if (mode === 'prod')
    return {
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
};

const buildConfig = getConfig('prod');
const devConfig = getConfig('dev');

module.exports = [buildConfig, devConfig];
