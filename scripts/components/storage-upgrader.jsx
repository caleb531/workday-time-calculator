import { defer } from 'lodash-es';
import m from 'mithril';
import StorageUpgrader from '../models/storage-upgrader.js';
import DismissableOverlayComponent from './dismissable-overlay.jsx';
import LoadingComponent from './loading.jsx';

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
    defer(() => {
      dom.focus();
    });
  }

  view() {
    return this.isVisible ? (
      <div className="storage-upgrade" tabIndex="1" oncreate={this.blurEditor}>
        <DismissableOverlayComponent
          onDismiss={() => {
            /* do nothing */
          }}
        />

        <div className="panel storage-upgrade-panel">
          <h2 className="storage-upgrade-heading">Upgrading Database...</h2>

          <p className="storage-upgrade-message">
            Hang tight while we upgrade the database...
          </p>

          <LoadingComponent className="storage-upgrade-loading" />
        </div>
      </div>
    ) : null;
  }
}

export default StorageUpgraderComponent;
