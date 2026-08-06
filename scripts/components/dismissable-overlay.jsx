import { omit } from 'es-toolkit';

class DismissableOverlayComponent {
  view({ attrs }) {
    return (
      <button
        className="dismissable-overlay"
        {...omit(attrs, ['onDismiss'])}
        onclick={() => attrs.onDismiss()}
      />
    );
  }
}

export default DismissableOverlayComponent;
