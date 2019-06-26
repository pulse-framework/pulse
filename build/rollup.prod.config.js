import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import {terser} from "rollup-plugin-terser";
import replace from 'rollup-plugin-replace';
const prod = process.env.PRODUCTION;

export default {
  input: './lib/index.js',
  output: [
    {
      file: 'dist/pulse.min.js',
      name: 'pulse',
      format: 'umd',
      exports: 'named'
    },
    {
      file: 'dist/pulse.cjs.min.js',
      name: 'pulse',
      format: 'cjs',
      exports: 'named'
    },
    {
      file: 'dist/pulse.esm.min.js',
      name: 'pulse',
      format: 'es',
      exports: 'named'
    }
  ],
  plugins: [
    nodeResolve({
      browser: true
    }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
    }),
    terser()
  ]
};
