import m from 'mithril';
import { registerSW } from 'virtual:pwa-register';
import LoadingComponent from './loading.jsx';

class UpdateNotificationComponent {
  // Use Vite PWA plugin to manage service worker updates (source:
  // <https://vite-pwa-org.netlify.app/guide/prompt-for-update.html#importing-virtual-modules>)
  oninit() {
    // Initialize UI state even when local development skips service-worker registration
    this.isUpdateAvailable = false;
    this.isUpdating = false;

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
    this.updateSW = registerSW({
      onNeedRefresh: () => {
        this.isUpdateAvailable = true;
        m.redraw();
      }
    });
  }

  // Mark the notification as busy and schedule the new bubble state for Mithril's next redraw
  startUpdating() {
    this.isUpdating = true;
    m.redraw();
  }

  // Ask the waiting service worker to activate after the content crossfade has ended
  activateUpdate() {
    if (this.updateSW) {
      this.updateSW();
    }
  }

  // Return the crossfade duration; reduced-motion users receive the visual update immediately
  getUpdateDelay() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : 350;
  }

  // Start the declarative updating state once and wait to activate until its CSS crossfade has ended
  update() {
    if (this.isUpdating) {
      return;
    }

    this.startUpdating();
    // Delay activation so a reload cannot interrupt the visible content handoff
    window.setTimeout(() => this.activateUpdate(), this.getUpdateDelay());
  }

  // Render overlapping message and updating layers so the bubble retains the message's dimensions
  view() {
    return this.isUpdateAvailable ? (
      <div className="update-notification" onclick={() => this.update()}>
        <div
          className={
            this.isUpdating
              ? 'update-notification-bubble update-notification-bubble-updating'
              : 'update-notification-bubble'
          }
        >
          <div
            className="update-notification-message"
            aria-hidden={this.isUpdating ? 'true' : 'false'}
          >
            <h2 className="update-notification-title">Update available!</h2>
            <p className="update-notification-subtitle">
              Click here to finish updating.
            </p>
          </div>
          <div
            className="update-notification-updating"
            aria-hidden={this.isUpdating ? 'false' : 'true'}
          >
            <LoadingComponent className="update-notification-loading" />
            <h2 className="update-notification-title">Updating...</h2>
          </div>
        </div>
      </div>
    ) : null;
  }
}

export default UpdateNotificationComponent;
