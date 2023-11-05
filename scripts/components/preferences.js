import m from 'mithril';
import Preferences from '../models/preferences.js';
import CloseButtonComponent from './close-button.js';
import ColorSwatchComponent from './color-swatch.js';
import DismissableOverlayComponent from './dismissable-overlay.js';
import RadioButtonComponent from './radio-button.js';

class PreferencesComponent {
  oninit({ attrs: { preferences, onClosePreferences } }) {
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

  view({ attrs: { preferencesOpen } }) {
    return m(
      'div.app-preferences',
      {
        class: preferencesOpen ? 'app-preferences-open' : '',
        onchange: (event) => this.savePreference(event)
      },
      [
        m(DismissableOverlayComponent, {
          onDismiss: () => this.onClosePreferences()
        }),

        m('div.panel.app-preferences-panel', [
          m(CloseButtonComponent, {
            onDismiss: () => this.onClosePreferences()
          }),

          m('h2.app-preferences-heading', 'Preferences'),

          Preferences.preferences.map((preference) => {
            return m(
              'div.app-preference',
              {
                'data-preference-id': preference.id
              },
              [
                m('label.app-preference-label', preference.label),
                m('p.app-preference-description', preference.description),
                m(
                  'div.app-preference-options',
                  preference.options.map((option) => {
                    // console.log(this.preferences[preference.id], option.value);
                    return m(
                      'div.app-preference-option',
                      {
                        class:
                          this.preferences[preference.id] === option.value
                            ? 'app-preference-option-selected'
                            : ''
                      },
                      [
                        m(RadioButtonComponent, {
                          preferences: this.preferences,
                          preference,
                          option
                        }),
                        preference.optionType === 'color'
                          ? m(ColorSwatchComponent, {
                              preferences: this.preferences,
                              preference,
                              option
                            })
                          : null,
                        m(
                          'label.app-preference-option-label',
                          {
                            for: `${preference.id}-${option.value}`
                          },
                          option.label
                        )
                      ]
                    );
                  })
                ),
                preference.id === 'reminderInterval' &&
                this.preferences.reminderInterval > 0 &&
                Notification.permission === 'denied'
                  ? m('p.app-preferences-notification-error', [
                      'Your web browser is currently blocking WTC reminder notifications. Please refer to ',
                      m(
                        'a[href="https://help.vwo.com/hc/en-us/articles/360007700494-How-To-Unblock-Notifications-From-A-Website-VWO-Help-"][target="_blank"]',
                        'this article'
                      ),
                      ' to fix this.'
                    ])
                  : null
              ]
            );
          })
        ])
      ]
    );
  }
}

export default PreferencesComponent;
