import CalendarComponent from './calendar.js';
import PrevIconComponent from './prev-icon.js';
import NextIconComponent from './next-icon.js';

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
        m('button.log-date-control.log-prev-day-control', {
          onclick: () => {
            this.selectPrevDay();
          }
        },
        m(PrevIconComponent)),
        m('button.log-date-control.log-next-day-control', {
          onclick: () => {
            this.selectNextDay();
          }
        },
        m(NextIconComponent))
      ]),
      m('div.log-selected-date', [
        m('div.log-selected-date-absolute', this.selectedDate.format('dddd, MMMM D, YYYY')),
        m('div.log-selected-date-relative', this.selectedDate.isSame(moment(), 'day') ? 'today' : `${this.selectedDate.fromNow()}`),
      ]),

      m(CalendarComponent, {
        selectedDate: this.selectedDate,
        onSetSelectedDate: (selectedDate) => {
          this.selectedDate = selectedDate.clone();
        }
      })

    ]);

  }

}

export default DateComponent;
