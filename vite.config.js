import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // By default, Vite will assume we are serving from the root of the domain
  // (i.e. /); however, because we are serving Workday Time Calculator from a
  // subdirectory of my projects domain (e.g.
  // https://projects.calebevans.me/workday-time-calculator/), we must specify .
  // as the base directory to serve from
  base: './',
  // Enable JSX processing for *.jsx files
  esbuild: {
    // We need to use _m as the imported name so that it doesn't collide with
    // explicitly importing _m, while still allowing us to have organizeImports
    // strip out "unused" mithril imports
    jsxInject: "import _m from 'mithril'",
    jsxFactory: '_m',
    jsxFragment: '_m.Fragment'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      'fake-indexeddb/auto',
      '@vitest/web-worker',
      '@testing-library/jest-dom',
      'tests/setup.js'
    ],
    coverage: {
      reporter: ['text', 'lcov', 'html', 'text-summary']
    }
  },
  plugins: [
    VitePWA({
      filename: 'service-worker.js',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true
      },
      manifest: {
        short_name: 'WTC',
        name: 'Workday Time Calculator',
        description:
          'A minimal time-tracking app with features like autocomplete, notifications, and one-click Copy to Clipboard.',
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#113355',
        background_color: '#113355',
        icons: [
          {
            src: 'app-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'app-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'app-icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
