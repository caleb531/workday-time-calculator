import m from '../../node_modules/mithril/mithril.js';

import AppComponent from './app.js';

m.mount(document.body, AppComponent);

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('service-worker.js');
}
