import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';

class PreferencesComponent {

  oninit({attrs: {onClosePreferences}}) {
    this.onClosePreferences = onClosePreferences;
  }

  view({attrs: {preferencesOpen}}) {
    return m('div.app-preferences', {
      class: preferencesOpen ? 'app-preferences-open' : ''
    }, [

      m(DismissableOverlayComponent, {onDismiss: () => this.onClosePreferences()}),

      m('div.app-preferences-panel', [

        m('h2', 'Preferences'),

        m('div.app-preference', [
          m('label', 'Reminder Interval'),
          m('p', 'The frequency you receive reminders to update your time log'),
          m('select[name=reminder-interval]', [
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
