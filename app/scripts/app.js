import Log from './models/log.js';

import SettingsComponent from './tools.js';
import EditorComponent from './editor.js';
import DateComponent from './date.js';
import SummaryComponent from './summary.js';
import UpdateNotificationComponent from './update-notification.js';

class AppComponent {

  oninit() {
    this.selectedDate = moment();
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
        m(SettingsComponent)
      ]),
      m('div.app-content', [

        m('div.log-area', [

          m(EditorComponent, {
            selectedDate: this.selectedDate,
            onSetLogContents: (logContents) => {
              this.logContents = logContents;
            }
          }),

          m(DateComponent, {
            selectedDate: this.selectedDate,
            onSetSelectedDate: (selectedDate) => {
              this.selectedDate = selectedDate.clone();
            }
          })

        ]),

        this.logContents ? m(SummaryComponent, {
          log: new Log(this.logContents)
        }) : null

      ])

    ]);

  }

}

export default AppComponent;
