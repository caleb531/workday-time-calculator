import { omit } from 'lodash-es';

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
