import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import _ from 'lodash';

class StorageUpgraderComponent {

  oninit() {
    if (this.shouldUpgrade()) {
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

  // Only prompt to upgrade the data store format under certain conditions
  shouldUpgrade() {
    return (
      // The browser must support IndexedDB
      typeof indexedDB !== 'undefined'
      &&
      // The user has not already migrated from localStorage to IndexedDB
      !localStorage.getItem('wtc-idb-enabled')
      &&
      // The user has at least one time log saved in the app
      Object.keys(localStorage).find((key) => /^wtc-/.test(key))
    );
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
