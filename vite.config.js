import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // By default, Vite will assume we are serving from the root of the domain
  // (i.e. /); however, because we are serving Truthy from a subdirectory of my
  // projects domain (e.g. https://projects.calebevans.me/truthy/), we must
  // specify . as the base directory to serve from
  base: './',
  plugins: [
    VitePWA({
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts.(?:googleapis|gstatic).com\/(.*)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts'
            }
          }
        ],
        cleanupOutdatedCaches: true
      },
      manifest: {
        short_name: 'WTC',
        name: 'Workday Time Calculator',
        description: 'A minimal time-tracking app with features like autocomplete, notifications, and one-click Copy to Clipboard.',
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '##113355',
        background_color: '##113355',
        icons: [
          {
            src: 'app-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'app-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
