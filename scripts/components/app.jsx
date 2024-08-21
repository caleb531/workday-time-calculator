import m from 'mithril';
import moment from 'moment';
import Log from '../models/log.js';
import Preferences from '../models/preferences.js';
import ReminderManager from '../models/reminder-manager.js';
import DateComponent from './date.jsx';
import EditorComponent from './editor.jsx';
import LoadingComponent from './loading.jsx';
import StorageUpgraderComponent from './storage-upgrader.jsx';
import SummaryComponent from './summary.jsx';
import ToolsComponent from './tools.jsx';
import UpdateNotificationComponent from './update-notification.jsx';

class AppComponent {
  oninit() {
    this.preferences = new Preferences();
    this.preferencesLoaded = false;
    this.preferences.load().then(() => {
      this.preferencesLoaded = true;
      // We need to wait for the preferences to load before we can initialize
      // the reminder notification system
      this.reminderManager = new ReminderManager({
        preferences: this.preferences
      });
      m.redraw();
    });
    this.selectedDate = moment();
    this.setColorThemeOnBody();
  }

  onupdate() {
    this.setColorThemeOnBody();
  }

  // In order for the color theme's background color to infinitely repeat on
  // the page, the color theme's background color MUST be set on the <body>
  // element; however, since the <body> is not within the scope of the virtual
  // DOM, we must query it manually
  setColorThemeOnBody() {
    document.body.style = `--current-color-theme-color: var(--color-theme-color-${this.preferences.colorTheme});`;
  }

  view() {
    return (
      <div className="app">
        {/* The UpdateNotificationComponent manages its own visibility */}
        <UpdateNotificationComponent updateManager={this.updateManager} />
        <header className="app-header">
          <h1>Workday Time Calculator</h1>
          <span id="personal-site-link" className="nav-link nav-link-right">
            by <a href="https://calebevans.me/">Caleb Evans</a>
          </span>
          <ToolsComponent preferences={this.preferences} />
        </header>
        {this.preferencesLoaded ? (
          <div className="app-content">
            <StorageUpgraderComponent />

            <div className="log-area">
              <EditorComponent
                preferences={this.preferences}
                selectedDate={this.selectedDate}
                onSetLogContents={(logContents) => {
                  // Instantiate a new Log object and automatically compute
                  // additional log statistics such as gaps and overlaps
                  this.log = new Log(logContents, {
                    preferences: this.preferences,
                    calculateStats: true
                  });
                }}
              />

              <DateComponent
                preferences={this.preferences}
                selectedDate={this.selectedDate}
                onSetSelectedDate={(selectedDate) => {
                  this.selectedDate = selectedDate.clone();
                }}
              />
            </div>

            {this.log ? (
              <SummaryComponent
                preferences={this.preferences}
                log={this.log}
              />
            ) : null}
          </div>
        ) : (
          <LoadingComponent className="app-loading" />
        )}
      </div>
    );
  }
}

export default AppComponent;
