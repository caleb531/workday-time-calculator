import m from 'mithril';
import moment from 'moment';
import AppLock from '../models/app-lock.js';
import Log from '../models/log.js';
import Preferences from '../models/preferences.js';
import ReminderManager from '../models/reminder-manager.js';
import AppLockComponent from './app-lock.jsx';
import EditorComponent from './editor.jsx';
import LogDateComponent from './log-date.jsx';
import StorageUpgraderComponent from './storage-upgrader.jsx';
import SummaryComponent from './summary.jsx';
import ToolsComponent from './tools.jsx';
import UpdateNotificationComponent from './update-notification.jsx';

// Own app startup so only the tab holding the writer lock can initialize controls
class AppComponent {
  // Prepare the theme immediately but defer storage access until ownership is known
  oninit() {
    // Default preferences provide a theme before persisted preferences can be loaded
    this.preferences = new Preferences();
    // Track whether the interactive app has finished loading its preferences
    this.preferencesLoaded = false;
    // Prevent asynchronous lock and preference callbacks from reviving an unmounted app
    this.isRemoved = false;
    // Ensure error fallback cannot initialize the application twice
    this.isInitialized = false;
    // Preserve the existing default of opening today's log
    this.selectedDate = moment();
    this.setColorThemeOnBody();

    // Subscribe before starting so synchronous fallback also initializes the app
    this.appLock = new AppLock();
    // React to ownership while keeping startup and navigation in the component
    this.appLock.on('change', (status) => {
      if (status === 'ready') {
        this.initializeApp();
      } else if (status === 'reloading') {
        // The model emits this transition once and continues holding ownership
        window.location.reload();
      }
      m.redraw();
    });
    this.appLock.start();
  }

  // Load persisted state only after acquisition or the unsupported-browser fallback
  initializeApp() {
    if (this.isRemoved || this.isInitialized) {
      return;
    }
    this.isInitialized = true;
    this.preferences.load().then(() => {
      if (this.isRemoved) {
        return;
      }
      this.preferencesLoaded = true;
      // We need to wait for the preferences to load before we can initialize
      // the reminder notification system
      this.reminderManager = new ReminderManager({
        preferences: this.preferences
      });
      m.redraw();
    });
    m.redraw();
  }

  // Keep the document background synchronized with the current theme
  onupdate() {
    this.setColorThemeOnBody();
  }

  // Release held ownership and prevent pending requests from acquiring after unmount
  onremove() {
    this.isRemoved = true;
    this.appLock.dispose();
  }

  // In order for the color theme's background color to infinitely repeat on
  // the page, the color theme's background color MUST be set on the <body>
  // element; however, since the <body> is not within the scope of the virtual
  // DOM, we must query it manually
  setColorThemeOnBody() {
    document.body.style = `--current-color-theme-color: var(--color-theme-color-${this.preferences.colorTheme});`;
  }

  // Mount interactive components only after startup has permission to access storage
  view() {
    return (
      <div className="app">
        {/* The UpdateNotificationComponent manages its own visibility */}
        {this.isInitialized ? (
          <UpdateNotificationComponent updateManager={this.updateManager} />
        ) : null}
        <header className="app-header">
          <h1>Workday Time Calculator</h1>
          <span id="personal-site-link" className="nav-link nav-link-right">
            by <a href="https://calebevans.me/">Caleb Evans</a>
          </span>
          {this.preferencesLoaded ? (
            <ToolsComponent preferences={this.preferences} />
          ) : null}
        </header>
        {this.appLock.status === 'blocked' ||
        this.appLock.status === 'reloading' ? (
          <AppLockComponent />
        ) : null}
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

              <LogDateComponent
                preferences={this.preferences}
                selectedDate={this.selectedDate}
                onSetSelectedDate={(selectedDate) => {
                  this.selectedDate = selectedDate.clone();
                }}
              />
            </div>

            {this.log ? (
              <SummaryComponent preferences={this.preferences} log={this.log} />
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
}

export default AppComponent;
