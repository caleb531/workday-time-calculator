import m from 'mithril';

class DismissableOverlayComponent {
  view({ attrs: { onDismiss } }) {
    return m('div.dismissable-overlay', { onclick: () => onDismiss() });
  }
}

export default DismissableOverlayComponent;
