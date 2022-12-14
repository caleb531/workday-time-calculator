import m from 'mithril';

class UpdateNotificationComponent {
  view({ attrs: { updateManager } }) {
    return m(
      'div.update-notification',
      {
        class: updateManager.isUpdateAvailable ? 'update-available' : '',
        onclick: () => updateManager.update()
      },
      m('div.update-notification-bubble', [
        m('h2.update-notification-title', 'Update available!'),
        m('p.update-notification-subtitle', 'Click here to finish updating.')
      ])
    );
  }
}

export default UpdateNotificationComponent;
