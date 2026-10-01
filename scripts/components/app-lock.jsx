import DismissableOverlayComponent from './dismissable-overlay.jsx';

// Present a permanent blocking panel while another tab owns the application
class AppLockComponent {
  // Move focus to the message once Mithril has attached the panel to the document
  oncreate({ dom }) {
    dom.querySelector('[role="dialog"]').focus();
  }

  // Ownership is controlled by the AppLock model; this panel cannot dismiss itself
  view() {
    return (
      <div className="app-lock">
        <DismissableOverlayComponent
          tabIndex="-1"
          aria-hidden="true"
          onDismiss={() => {
            // Leave the message visible until ownership becomes available
          }}
        />
        <div
          className="panel app-lock-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-lock-heading"
          aria-describedby="app-lock-message"
        >
          <h2 id="app-lock-heading">Already Open</h2>
          <p id="app-lock-message" className="app-lock-message">
            Workday Time Calculator is already open in another tab. To prevent
            overwriting log contents, the app can only be open in one tab at a
            time.
          </p>
        </div>
      </div>
    );
  }
}

export default AppLockComponent;
