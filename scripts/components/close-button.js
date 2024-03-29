import { omit } from 'lodash-es';
import m from 'mithril';

class CloseButtonComponent {
  view({ attrs }) {
    return m(
      'button.close-button',
      {
        ...omit(attrs, ['onClose']),
        onclick: () => attrs.onClose()
      },
      m('svg[viewBox="0 0 24 24"]', [
        m(
          'path[d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"]'
        ),
        m('path[d="M0 0h24v24H0z"][fill="none"]')
      ])
    );
  }
}

export default CloseButtonComponent;
