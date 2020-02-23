import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import CloseButtonComponent from './close-button.js';

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
    this.preferences.set(event.target.name, preferenceValue);
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

        m('h2.app-preference-heading', 'Preferences'),

        PreferencesComponent.preferences.map((preference) => {
          return m('div.app-preference', [
            m('label.app-preference-label', preference.label),
            m('p.app-preference-description', preference.description),
            m('div.app-preference-options', preference.options.map((option) => {
              // console.log(this.preferences[preference.id], option.value);
              return m('div.app-preference-option', [
                m('input.app-preference-option-value', {
                  name: preference.id,
                  id: `${preference.id}-${option.value}`,
                  type: preference.type,
                  value: option.value,
                  checked: (this.preferences[preference.id] === option.value)
                }),
                m('label.app-preference-option-label', {
                  for: `${preference.id}-${option.value}`
                }, option.label),
              ]);
            }))
          ]);
        })

      ])

    ]);
  }

}
PreferencesComponent.preferences = [
  {
    id: 'reminderInterval',
    label: 'Reminder Interval',
    description: 'How often should WTC remind you to update your time log?',
    type: 'radio',
    options: [
      {label: 'Never', value: 0},
      {label: 'Every 15 minutes', value: 15},
      {label: 'Every half-hour', value: 30},
      {label: 'Every hour', value: 60},
    ]
  }
];

export default PreferencesComponent;
