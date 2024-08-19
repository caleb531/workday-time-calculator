import { omit } from 'lodash-es';
import m from 'mithril';

class DismissableOverlayComponent {
  view({ attrs }) {
    return m(`button.dismissable-overlay`, {
      ...omit(attrs, ['onDismiss']),
      onclick: () => attrs.onDismiss()
    });
  }
}

export default DismissableOverlayComponent;
