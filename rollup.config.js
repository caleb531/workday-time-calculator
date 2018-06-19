let commonjs = require('rollup-plugin-commonjs');
let resolve = require('rollup-plugin-node-resolve');
let json = require('rollup-plugin-json');

module.exports = {
  input: 'app/scripts/index.js',
  output: {
    file: 'public/scripts/index.js',
    name: 'wtc',
    sourcemap: true,
    format: 'iife'
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs(),
    json()
  ]
};
