import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import CloseButtonComponent from './close-button.js';
import RadioButtonComponent from './radio-button.js';

class PreferencesComponent {

  oninit({attrs: {preferences, onClosePreferences}}) {
    this.preferences = preferences;
    this.onClosePreferences = onClosePreferences;
  }

  savePreference(event) {
    let preferenceValue;
    if (!isNaN(event.target.value)) {
      preferenceValue = Number(event.target.value);
    } else {
      preferenceValue = event.target.value;
    }
    this.preferences.set({
      [event.target.name]: preferenceValue
    });
    this.preferences.save();
  }

  view({attrs: {preferencesOpen}}) {
    return m('div.app-preferences', {
      class: preferencesOpen ? 'app-preferences-open' : '',
      onchange: (event) => this.savePreference(event)
    }, [

      m(DismissableOverlayComponent, {onDismiss: () => this.onClosePreferences()}),

      m('div.app-preferences-panel', [

        m(CloseButtonComponent, {onDismiss: () => this.onClosePreferences()}),

        m('h2.app-preferences-heading', 'Preferences'),

        PreferencesComponent.preferences.map((preference) => {
          return m('div.app-preference', [
            m('label.app-preference-label', preference.label),
            m('p.app-preference-description', preference.description),
            m('div.app-preference-options', preference.options.map((option) => {
              // console.log(this.preferences[preference.id], option.value);
              return m('div.app-preference-option', [
                m(RadioButtonComponent, {
                  preferences: this.preferences,
                  preference,
                  option
                }),
                m('label.app-preference-option-label', {
                  for: `${preference.id}-${option.value}`
                }, option.label),
              ]);
            })),
            preference.id === 'reminderInterval' && this.preferences.reminderInterval > 0 && Notification.permission === 'denied' ? m('p.app-preferences-notification-error', [
              'Your web browser is currently blocking WTC reminder notifications. Please refer to ',
              m('a[href="https://help.vwo.com/hc/en-us/articles/360007700494-How-To-Unblock-Notifications-From-A-Website-VWO-Help-"][target="_blank"]', 'this article'),
              ' to fix this.'
            ]) : null
          ]);
        }),

      ])

    ]);
  }

}
PreferencesComponent.preferences = [
  {
    id: 'reminderInterval',
    label: 'Reminder Interval',
    description: 'How often should WTC remind you to update your time log?',
    options: [
      {label: 'Never', value: 0},
      {label: 'Every 15 minutes', value: 15},
      {label: 'Every half-hour', value: 30},
      {label: 'Every hour', value: 60}
    ]
  },
  {
    id: 'timeSystem',
    label: 'Time System',
    description: 'What time system do you want to use when entering hh:mm times?',
    options: [
      {label: '12-hour', value: '12-hour'},
      {label: '24-hour / military time', value: '24-hour'}
    ]
  }
];

export default PreferencesComponent;
