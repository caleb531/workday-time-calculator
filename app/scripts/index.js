import AppComponent from './app.js';

m.mount(document.body, AppComponent);

if (navigator.serviceWorker && window.location.protocol === 'https:') {
  navigator.serviceWorker.register('service-worker.js');
}
