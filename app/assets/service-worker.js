importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js');

if (workbox) {

  workbox.routing.registerRoute(
    /\.(?:html|js|css)$/,
    workbox.strategies.staleWhileRevalidate()
  );

}