import m from 'mithril';
import { registerSW } from 'virtual:pwa-register';

class UpdateNotificationComponent {
  // Use Vite PWA plugin to manage service worker updates (source:
  // <https://vite-pwa-org.netlify.app/guide/prompt-for-update.html#importing-virtual-modules>)
  oninit() {
    if (!navigator.serviceWorker) {
      return;
    }
    if (
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') &&
      !sessionStorage.getItem('sw')
    ) {
      return;
    }
    this.isUpdateAvailable = false;
    this.updateSW = registerSW({
      onNeedRefresh: () => {
        this.isUpdateAvailable = true;
        m.redraw();
      }
    });
  }

  update() {
    if (this.updateSW) {
      this.updateSW();
    }
  }

  view({ attrs: { updateManager } }) {
    return this.isUpdateAvailable
      ? m(
          'div.update-notification',
          {
            onclick: () => this.update()
          },
          m('div.update-notification-bubble', [
            m('h2.update-notification-title', 'Update available!'),
            m(
              'p.update-notification-subtitle',
              'Click here to finish updating.'
            )
          ])
        )
      : null;
  }
}

export default UpdateNotificationComponent;
