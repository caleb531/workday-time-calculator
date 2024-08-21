import clsx from 'clsx';
import Preferences from '../models/preferences.js';
import CloseButtonComponent from './close-button.jsx';
import ColorSwatchComponent from './color-swatch.jsx';
import DismissableOverlayComponent from './dismissable-overlay.jsx';
import RadioButtonComponent from './radio-button.jsx';

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
    return (
      <div
        className={clsx('app-preferences', {
          'app-preferences-open': preferencesOpen
        })}
        onchange={(event) => this.savePreference(event)}
      >
        <DismissableOverlayComponent
          aria-labelledby="app-preferences-close-control"
          onDismiss={() => this.onClosePreferences()}
        />

        <div className="panel app-preferences-panel">
          <CloseButtonComponent
            id="app-preferences-close-control"
            aria-label="Close Preferences"
            onClose={() => this.onClosePreferences()}
          />

          <h2 className="app-preferences-heading">Preferences</h2>

          {Preferences.preferences.map((preference) => {
            return (
              <div
                className="app-preference"
                data-preference-id={preference.id}
              >
                <label className="app-preference-label">
                  {preference.label}
                </label>
                <p className="app-preference-description">
                  {preference.description}
                </p>
                <div className="app-preference-options">
                  {preference.options.map((option) => {
                    return (
                      <div
                        className={clsx('app-preference-option', {
                          'app-preference-option-selected':
                            this.preferences[preference.id] === option.value
                        })}
                      >
                        <RadioButtonComponent
                          preferences={this.preferences}
                          preference={preference}
                          option={option}
                        />
                        {preference.optionType === 'color' ? (
                          <ColorSwatchComponent
                            preferences={this.preferences}
                            preference={preference}
                            option={option}
                          />
                        ) : null}
                        <label
                          className="app-preference-option-label"
                          htmlFor={`${preference.id}-${option.value}`}
                        >
                          {option.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {preference.id === 'reminderInterval' &&
                this.preferences.reminderInterval > 0 &&
                Notification.permission === 'denied' ? (
                  <p className="app-preferences-notification-error">
                    Your web browser is currently blocking WTC reminder
                    notifications. Please refer to
                    <a
                      href="https://help.vwo.com/hc/en-us/articles/360007700494-How-To-Unblock-Notifications-From-A-Website-VWO-Help-"
                      target="_blank"
                    >
                      this article
                    </a>
                    to fix this.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default PreferencesComponent;
