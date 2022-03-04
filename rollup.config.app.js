let commonjs = require('rollup-plugin-commonjs');
let resolve = require('rollup-plugin-node-resolve');
let json = require('rollup-plugin-json');
let uglify = require('rollup-plugin-uglify-es');

module.exports = {
  input: 'app/scripts/index.js',
  output: {
    file: 'public/scripts/index.js',
    name: 'wtc',
    sourcemap: true,
    format: 'iife',
    globals: {
      'mithril': 'm',
      'moment': 'moment',
      'quill': 'Quill',
      'idb-keyval': 'idbKeyval',
      'lodash': '_',
      'clipboard': 'ClipboardJS',
      'sw-update-manager': 'SWUpdateManager'
    }
  },
  external: [
    'mithril',
    'moment',
    'quill',
    'idb-keyval',
    'lodash',
    'clipboard',
    'sw-update-manager'
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    uglify()
  ]
};
