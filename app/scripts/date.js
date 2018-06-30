import CalendarComponent from './calendar.js';
import PrevIconComponent from './prev-icon.js';
import NextIconComponent from './next-icon.js';
import CalendarIconComponent from './calendar-icon.js';

class DateComponent {

  oninit({attrs}) {
    this.selectedDate = moment();
    this.onSetSelectedDate = attrs.onSetSelectedDate;
    this.onSetSelectedDate(this.selectedDate);
    this.calendarOpen = false;
  }

  selectPrevDay() {
    this.selectedDate.subtract(1, 'day');
    this.onSetSelectedDate(this.selectedDate);
  }

  selectNextDay() {
    this.selectedDate.add(1, 'day');
    this.onSetSelectedDate(this.selectedDate);
  }

  toggleCalendar() {
    this.calendarOpen = !this.calendarOpen;
  }

  view() {
    return m('div.log-date-area', [

      m('div.log-date-controls', [
        m('button.log-date-control.log-date-prev-control', {
          onclick: () => {
            this.selectPrevDay();
          }
        },
        m(PrevIconComponent)),
        m('button.log-date-control.log-date-calendar-control', {
          onclick: () => {
            this.toggleCalendar();
          }
        },
        m(CalendarIconComponent)),
        m('button.log-date-control.log-date-next-control', {
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
        calendarOpen: this.calendarOpen,
        onSetSelectedDate: (selectedDate) => {
          this.selectedDate = selectedDate.clone();
          this.onSetSelectedDate(this.selectedDate);
          m.redraw();
        }
      })

    ]);

  }

}

export default DateComponent;
