import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import LoadingComponent from './loading.js';
import StorageUpgrader from '../models/storage-upgrader.js';
import _ from 'lodash';

class StorageUpgraderComponent {
  oninit() {
    this.upgrader = new StorageUpgrader();
    if (this.upgrader.shouldUpgrade()) {
      this.isVisible = true;
      this.upgrade();
    }
  }

  upgrade() {
    // Show the upgrade panel for a minimum of 1000ms so the user has time to
    // perceive what's happening
    setTimeout(() => {
      try {
        this.upgrader.upgrade().catch((error) => {
          this.handleError(error);
        });
      } catch (error) {
        this.handleError(error);
      }
    }, 1000);
  }

  handleError(error) {
    console.error(error);
    this.isVisible = false;
    m.redraw();
  }

  // When the Storage Upgrade prompt shows, blur the editor by focusing the
  // prompt
  blurEditor({ dom }) {
    _.defer(() => {
      dom.focus();
    });
  }

  view() {
    return this.isVisible
      ? m(
          'div.storage-upgrade',
          {
            tabindex: '1',
            oncreate: this.blurEditor
          },
          [
            m(DismissableOverlayComponent, {
              onDismiss: () => {
                /* do nothing */
              }
            }),

            m('div.panel.storage-upgrade-panel', [
              m('h2.storage-upgrade-heading', 'Upgrading Database...'),

              m(
                'p.storage-upgrade-message',
                'Hang tight while we upgrade the database...'
              ),

              m(LoadingComponent, { class: 'storage-upgrade-loading' })
            ])
          ]
        )
      : null;
  }
}

export default StorageUpgraderComponent;
