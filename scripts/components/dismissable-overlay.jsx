import { omit } from 'es-toolkit';
import m from 'mithril';

// Share backdrop and Escape dismissal across panels
class DismissableOverlayComponent {
  // Listen beyond the backdrop because focus can remain on the opening control
  oncreate({ dom, attrs }) {
    // Let nested controls handle Escape first and dismiss only the topmost overlay
    this.onDocumentKeyDown = (event) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        dom !==
          Array.from(document.querySelectorAll('.dismissable-overlay')).at(-1)
      ) {
        return;
      }
      event.preventDefault();
      attrs.onDismiss();
      m.redraw();
    };
    document.addEventListener('keydown', this.onDocumentKeyDown);
  }

  // Stop listening when the owning panel closes
  onremove() {
    document.removeEventListener('keydown', this.onDocumentKeyDown);
  }

  // Render the existing native backdrop button
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
