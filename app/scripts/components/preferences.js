import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import CloseButtonComponent from './close-button.js';
import RadioButtonComponent from './radio-button.js';
import ColorSwatchComponent from './color-swatch.js';

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

      m('div.panel.app-preferences-panel', [

        m(CloseButtonComponent, {onDismiss: () => this.onClosePreferences()}),

        m('h2.app-preferences-heading', 'Preferences'),

        PreferencesComponent.preferences.map((preference) => {
          return m('div.app-preference', {
            'data-preference-id': preference.id
          }, [
            m('label.app-preference-label', preference.label),
            m('p.app-preference-description', preference.description),
            m('div.app-preference-options', preference.options.map((option) => {
              // console.log(this.preferences[preference.id], option.value);
              return m('div.app-preference-option', {
                class: (this.preferences[preference.id] === option.value) ? 'app-preference-option-selected' : ''
              }, [
                m(RadioButtonComponent, {
                  preferences: this.preferences,
                  preference,
                  option
                }),
                preference.optionType === 'color' ? m(ColorSwatchComponent, {
                  preferences: this.preferences,
                  preference,
                  option
                }) : null,
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
    id: 'colorTheme',
    label: 'Color Theme',
    description: 'What color would you like as your WTC app\'s theme?',
    optionType: 'color',
    options: [
      {label: 'Blue', value: 'blue'},
      {label: 'Green', value: 'green'},
      {label: 'Purple', value: 'purple'},
      {label: 'Rose', value: 'rose'},
      {label: 'Slate', value: 'slate'},
    ]
  },
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
    id: 'autocompleteMode',
    label: 'Autocomplete Suggestions',
    description: 'Would you like WTC to suggest words as you type in the editor? These suggestions are based on your log history, and no information ever leaves your local device.',
    options: [
      {label: 'Enabled', value: 'on'},
      {label: 'Disabled', value: 'off'}
    ]
  },
  {
    id: 'timeSystem',
    label: 'Time System',
    description: 'Which time system do you prefer when entering and displaying times?',
    options: [
      {label: '12-hour', value: '12-hour'},
      {label: '24-hour / military time', value: '24-hour'}
    ]
  },
  {
    id: 'categorySortOrder',
    label: 'Category Sort Order',
    description: 'How should category groupings be sorted in the Summary view?',
    options: [
      {label: 'No sorting', value: 'none'},
      {label: 'Title (ascending)', value: 'title'},
      {label: 'Duration (descending)', value: 'duration'}
    ]
  }
];

export default PreferencesComponent;
