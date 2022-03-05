import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import StorageUpgrader from './models/storage-upgrader.js';
import _ from 'lodash';

class StorageUpgraderComponent {

  oninit() {
    this.upgrader = new StorageUpgrader();
    console.log(this.upgrader);
    if (this.upgrader.shouldUpgrade()) {
      this.isVisible = true;
    }
  }

  // When the Storage Upgrade prompt shows, blur the editor by focusing the
  // prompt
  blurEditor({dom}) {
    _.defer(() => {
      dom.focus();
    });
  }

  view() {
    return this.isVisible ? m('div.storage-upgrade', {
      tabindex: '1',
      oncreate: this.blurEditor
    }, [

      m(DismissableOverlayComponent, {onDismiss: () => {/* do nothing */}}),

      m('div.panel.storage-upgrade-panel', [
        m('h2.storage-upgrade-heading', 'Upgrading Database...'),

        m('p.storage-upgrade-message', 'Hang tight while we upgrade the database...'),

        m('img.storage-upgrade-loading', {src: 'icons/loading.svg'})

      ]),

    ]) : null;
  }

}

export default StorageUpgraderComponent;
