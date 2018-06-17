import m from '../../node_modules/mithril/mithril.js';

import Log from './models/log.js';

import EditorComponent from './editor.js';
import DateComponent from './date.js';
import SummaryComponent from './summary.js';

class AppComponent {

  view() {
    return m('div.app', [
      m('header.app-header', [
        m('h1', 'Workday Time Calculator'),
        m('span#personal-site-link.nav-link.nav-link-right', [
          'by ', m('a[href=https://calebevans.me/]', 'Caleb Evans')
        ])
      ]),
      m('div.app-content', [

        m('div.log-area', [

          this.selectedDate ? m(EditorComponent, {
            selectedDate: this.selectedDate,
            onSetLogContents: (logContents) => {
              this.logContents = logContents;
              m.redraw();
            }
          }) : null,

          m(DateComponent, {
            onSetSelectedDate: (selectedDate) => {
              this.selectedDate = selectedDate.clone();
              m.redraw();
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
