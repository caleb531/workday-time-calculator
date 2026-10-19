import { omit } from 'es-toolkit';

class DismissableOverlayComponent {
  view({ attrs }) {
    return (
      <button
        className="dismissable-overlay"
        {...omit(attrs, ['onDismiss'])}
        onclick={() => attrs.onDismiss()}
      >
        {/* Show the overlay action when keyboard focus reaches the backdrop */}
        <span className="dismissable-overlay-focus-label">Close Overlay</span>
      </button>
    );
  }
}

export default DismissableOverlayComponent;
