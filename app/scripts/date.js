import m from '../../node_modules/mithril/mithril.js';
import moment from '../../node_modules/moment/moment.js';


class DateComponent {

  oninit({attrs}) {
    this.selectedDate = moment();
    this.onSetSelectedDate = attrs.onSetSelectedDate;
    this.onSetSelectedDate(this.selectedDate);
  }

  selectPrevDay() {
    this.selectedDate.subtract(1, 'day');
    this.onSetSelectedDate(this.selectedDate);
  }

  selectNextDay() {
    this.selectedDate.add(1, 'day');
    this.onSetSelectedDate(this.selectedDate);
  }

  view() {
    return m('div.log-date-area', [

      m('div.log-date-controls', [
        m('span.log-date-control.log-prev-day-control', {
          onclick: () => {
            this.selectPrevDay();
          }
        }, m('svg[viewBox="0 0 32 32"]', m('polyline', {
          points: '18,10 10,16 18,22'
        }))),
        m('span.log-date-control.log-next-day-control', {
          onclick: () => {
            this.selectNextDay();
          }
        }, m('svg[viewBox="0 0 32 32"]', m('polyline', {
          points: '12,10 20,16 12,22'
        })))
      ]),
      m('div.log-selected-date', [
        m('div.log-selected-date-absolute', this.selectedDate.format('dddd, MMM DD, YYYY')),
        m('div.log-selected-date-relative', this.selectedDate.isSame(moment(), 'day') ? 'today' : `${this.selectedDate.fromNow()}`),
      ])
    ]);

  }

}

export default DateComponent;
