import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';

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
    this.preferences[event.target.name] = preferenceValue;
    this.preferences.save();
  }

  view({attrs: {preferencesOpen}}) {
    return m('div.app-preferences', {
      class: preferencesOpen ? 'app-preferences-open' : '',
      onchange: (event) => this.savePreference(event)
    }, [

      m(DismissableOverlayComponent, {onDismiss: () => this.onClosePreferences()}),

      m('div.app-preferences-panel', [

        m('h2', 'Preferences'),

        m('div.app-preference', [
          m('label', 'Reminder Interval'),
          m('p', 'The frequency you receive reminders to update your time log'),
          m('select[name=reminderInterval]', {
            value: this.preferences.reminderInterval
          }, [
            m('option[value=0]', 'Never'),
            m('option[value=15]', 'Every 15 minutes'),
            m('option[value=30]', 'Every half hour'),
            m('option[value=60]', 'Every hour')
          ])
        ])

      ])

    ]);
  }

}

export default PreferencesComponent;
