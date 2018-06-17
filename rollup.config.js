import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import copy from 'rollup-plugin-copy';
import sass from 'rollup-plugin-sass';

export default {
  input: 'app/scripts/index.js',
  output: {
    file: 'public/scripts/index.js',
    format: 'iife',
    name: 'wtc',
    sourcemap: true
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    copy({
      'app/assets': 'public',
      'node_modules/quill/dist/quill.snow.css': 'public/styles/quill.snow.css'
    }),
    sass({
      output: 'public/styles/index.css'
    })
  ]
};
