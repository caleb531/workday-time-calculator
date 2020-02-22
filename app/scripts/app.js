import Log from './models/log.js';
import Preferences from './models/preferences.js';
import ReminderManager from './models/reminder-manager.js';

import m from 'mithril';
import moment from 'moment';
import SWUpdateManager from 'sw-update-manager';

import ToolsComponent from './tools.js';
import EditorComponent from './editor.js';
import DateComponent from './date.js';
import SummaryComponent from './summary.js';
import UpdateNotificationComponent from './update-notification.js';

class AppComponent {

  oninit() {
    this.preferences = new Preferences();
    this.selectedDate = moment();
    this.reminderManager = new ReminderManager();
    if (navigator.serviceWorker) {
      let serviceWorker = navigator.serviceWorker.register('service-worker.js');
      this.updateManager = new SWUpdateManager(serviceWorker);
      this.updateManager.on('updateAvailable', () => m.redraw());
      this.updateManager.checkForUpdates();
    }
  }

  view() {
    return m('div.app', [
      this.updateManager ? m(UpdateNotificationComponent, {
        updateManager: this.updateManager
      }) : null,
      m('header.app-header', [
        m('h1', 'Workday Time Calculator'),
        m('span#personal-site-link.nav-link.nav-link-right', [
          'by ', m('a[href=https://calebevans.me/]', 'Caleb Evans')
        ]),
        m(ToolsComponent)
      ]),
      m('div.app-content', [

        m('div.log-area', [

          m(EditorComponent, {
            selectedDate: this.selectedDate,
            onSetLogContents: (logContents) => {
              // Instantiate a new Log object and automatically compute
              // additional log statistics such as gaps and overlaps
              this.log = new Log(logContents, {calculateStats: true});
            }
          }),

          m(DateComponent, {
            selectedDate: this.selectedDate,
            onSetSelectedDate: (selectedDate) => {
              this.selectedDate = selectedDate.clone();
            }
          })

        ]),

        this.log ? m(SummaryComponent, {
          log: this.log
        }) : null

      ])

    ]);

  }

}

export default AppComponent;
