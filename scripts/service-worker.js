importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js');

// The following call will be populated automatically with the precached file
// data during the build step
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Cache Google fonts
workbox.routing.registerRoute(new RegExp('^https://fonts.(?:googleapis|gstatic).com/(.*)'), workbox.strategies.cacheFirst({
  cacheName: 'google-fonts',
  plugins: [
    // When the cap is reached, the oldest entries are purged
    new workbox.expiration.Plugin({
      maxEntries: 30
    }),
    // The Google Fonts CSS response is an opaque (non-CORS) response with a
    // status code of 0, so we need to enable caching for that type of response
    new workbox.cacheableResponse.Plugin({
      statuses: [0, 200]
    })
  ]
}));

// Listen for requests from the front end to update the service worker
// immediately
self.addEventListener('message', (event) => {
  if (!event.data) {
    return;
  }
  if (event.data.updateManagerEvent === 'update') {
    self.skipWaiting();
  }
});
