import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import {terser} from 'rollup-plugin-terser';
import watchGlobs from 'rollup-plugin-watch-globs';
import copy from 'rollup-plugin-copy';
import scss from 'rollup-plugin-scss';
import serve from 'rollup-plugin-serve';
import {injectManifest} from 'rollup-plugin-workbox';

export default {
  input: 'src/scripts/index.js',
  output: {
    file: 'dist/scripts/index.js',
    name: 'wtc',
    sourcemap: true,
    format: 'iife',
    exports: 'auto',
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
    watchGlobs(['src/styles/*.*', 'public/**/*.*']),
    copy({
      targets: [
        {src: 'public/*', dest: 'dist/'},
        {src: 'src/scripts/autocompletion-worker.js', dest: 'dist/scripts'},
        {src: 'node_modules/mithril/mithril.min.js', dest: 'dist/scripts'},
        {src: 'node_modules/moment/min/moment.min.js', dest: 'dist/scripts'},
        {src: 'node_modules/quill/dist/quill.min.js', dest: 'dist/scripts'},
        {src: 'node_modules/quill/dist/quill.snow.css', dest: 'dist/styles'},
        {src: 'node_modules/lodash/lodash.min.js', dest: 'dist/scripts'},
        {src: 'node_modules/clipboard/dist/clipboard.min.js', dest: 'dist/scripts'},
        {src: 'node_modules/sw-update-manager/sw-update-manager.js', dest: 'dist/scripts'},
        {src: 'node_modules/idb-keyval/dist/umd.js', dest: 'dist/scripts', rename: 'idb-keyval.min.js'},
      ]
    }),
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    scss({
      sourceMap: true,
      output: 'dist/styles/index.css',
      outputStyle: 'compressed'
    }),
    commonjs(),
    json(),
    process.env.NODE_ENV === 'production' ? terser() : null,
    injectManifest({
      globDirectory: 'dist',
      globPatterns: [
        '**\/*.{js,css,png}',
        'icons/*.svg'
      ],
      // Precaching index.html using templatedUrls fixes a "Response served by
      // service worker has redirections" error on iOS 12; see
      // <https://github.com/v8/v8.dev/issues/4> and
      // <https://github.com/v8/v8.dev/pull/7>
      templatedURLs: {
        '.': ['index.html']
      },
      swSrc: 'src/scripts/service-worker.js',
      swDest: 'dist/service-worker.js'
    }),
    process.env.SERVE_APP ? serve({
      contentBase: 'dist',
      port: 8080
    }) : null
  ]
};
