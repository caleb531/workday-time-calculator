import AppComponent from './app.js';

m.mount(document.body.querySelector('main'), AppComponent);

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('service-worker.js');
}
