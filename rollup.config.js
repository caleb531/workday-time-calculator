import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import copy from 'rollup-plugin-copy';

export default {
  input: 'app/scripts/index.js',
  output: {
    file: 'public/scripts/index.js',
    format: 'iife',
    name: 'wtc'
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    copy({
      'app/assets': 'public'
    })
  ]
};
