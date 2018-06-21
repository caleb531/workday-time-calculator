import AppComponent from './app.js';

m.mount(document.body, AppComponent);

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('service-worker.js');
}
