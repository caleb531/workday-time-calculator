import Log from '../models/log.js';
import Preferences from '../models/preferences.js';
import ReminderManager from '../models/reminder-manager.js';

import m from 'mithril';
import moment from 'moment';

import LoadingComponent from './loading.js';
import ToolsComponent from './tools.js';
import StorageUpgraderComponent from './storage-upgrader.js';
import EditorComponent from './editor.js';
import DateComponent from './date.js';
import SummaryComponent from './summary.js';
import UpdateNotificationComponent from './update-notification.js';

class AppComponent {
  oninit() {
    this.preferences = new Preferences();
    this.preferencesLoaded = false;
    this.preferences.load().then(() => {
      this.preferencesLoaded = true;
      m.redraw();
    });
    this.selectedDate = moment();
    this.reminderManager = new ReminderManager({
      preferences: this.preferences
    });
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
    document.body.className = `color-theme-${this.preferences.colorTheme}`;
  }

  view() {
    return m('div.app', [
      // The UpdateNotificationComponent manages its own visibility
      m(UpdateNotificationComponent, {
        updateManager: this.updateManager
      }),
      m('header.app-header', [
        m('h1', 'Workday Time Calculator'),
        m('span#personal-site-link.nav-link.nav-link-right', [
          'by ',
          m('a[href=https://calebevans.me/]', 'Caleb Evans')
        ]),
        m(ToolsComponent, { preferences: this.preferences })
      ]),
      this.preferencesLoaded
        ? m('div.app-content', [
            m(StorageUpgraderComponent),

            m('div.log-area', [
              m(EditorComponent, {
                preferences: this.preferences,
                selectedDate: this.selectedDate,
                onSetLogContents: (logContents) => {
                  // Instantiate a new Log object and automatically compute
                  // additional log statistics such as gaps and overlaps
                  this.log = new Log(logContents, {
                    preferences: this.preferences,
                    calculateStats: true
                  });
                }
              }),

              m(DateComponent, {
                preferences: this.preferences,
                selectedDate: this.selectedDate,
                onSetSelectedDate: (selectedDate) => {
                  this.selectedDate = selectedDate.clone();
                }
              })
            ]),

            this.log
              ? m(SummaryComponent, {
                  preferences: this.preferences,
                  log: this.log
                })
              : null
          ])
        : m(LoadingComponent, { class: 'app-loading' })
    ]);
  }
}

export default AppComponent;
