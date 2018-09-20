import CalendarComponent from './calendar.js';
import PrevIconComponent from './prev-icon.js';
import NextIconComponent from './next-icon.js';
import CalendarIconComponent from './calendar-icon.js';

class DateComponent {

  oninit({attrs: {selectedDate, onSetSelectedDate}}) {
    this.selectedDate = selectedDate.clone();
    this.onSetSelectedDate = onSetSelectedDate;
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
          onclick: () => this.selectPrevDay()
        }, m(PrevIconComponent)),
        m('button.log-date-control.log-date-calendar-control', {
          class: this.calendarOpen ? 'active' : '',
          onclick: () => this.toggleCalendar()
        }, m(CalendarIconComponent, {selectedDate: this.selectedDate})),
        m('button.log-date-control.log-date-next-control', {
          onclick: () => this.selectNextDay()
        }, m(NextIconComponent))
      ]),
      m('div.log-selected-date', [
        m('div.log-selected-date-absolute', this.selectedDate.format('dddd, MMMM D, YYYY')),
        m('div.log-selected-date-relative', this.selectedDate.isSame(moment(), 'day') ? 'today' : `${this.selectedDate.fromNow()}`),
      ]),

      this.selectedDate ? m(CalendarComponent, {
        selectedDate: this.selectedDate,
        calendarOpen: this.calendarOpen,
        onSetSelectedDate: (selectedDate) => {
          this.selectedDate = selectedDate.clone();
          this.onSetSelectedDate(this.selectedDate);
          m.redraw();
        },
        onCloseCalendar: () => {
          this.calendarOpen = false;
        }
      }) : null

    ]);

  }

}

export default DateComponent;
