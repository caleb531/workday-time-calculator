import PrevIconComponent from './prev-icon.js';
import NextIconComponent from './next-icon.js';

class CalendarComponent {

  oninit({attrs: {selectedDate, onSetSelectedDate, onCloseCalendar}}) {
    this.weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    this.onSetSelectedDate = onSetSelectedDate;
    this.onCloseCalendar = onCloseCalendar;
    this.onbeforeupdate({attrs: {selectedDate}});
  }

  onbeforeupdate({attrs: {selectedDate}}) {
    if (!this.selectedDate || !selectedDate.isSame(this.selectedDate)) {
      this.selectedDate = this.resetTime(selectedDate.clone());
      this.firstDayOfMonthInView = this.getFirstDayOfMonth(this.selectedDate);
    }
  }

  resetTime(date) {
    return date.set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0
    });
  }

  getToday() {
    return this.resetTime(moment());
  }

  getFirstDayOfMonth(date) {
    return date
      .clone()
      .date(1);
  }

  getFirstSundayInView(date) {
    return date
      .clone()
      .date(1)
      .weekday(0);
  }
  getLastSaturdayInView(date) {
    return date
      .clone()
      .date(date.daysInMonth())
      .weekday(6);
  }

  viewPrevMonth() {
    this.firstDayOfMonthInView.subtract(1, 'month');
  }
  viewNextMonth() {
    this.firstDayOfMonthInView.add(1, 'month');
  }

  selectDate(event) {
    if (event.target.classList.contains('log-calendar-date')) {
      this.selectedDate = moment(event.target.getAttribute('data-date'), 'l');
      this.firstDayOfMonthInView = this.getFirstDayOfMonth(this.selectedDate);
      this.onSetSelectedDate(this.selectedDate);
    }
    event.redraw = false;
  }

  closeCalendarAfterDblClickDate(event) {
    if (event.target.classList.contains('log-calendar-date')) {
      this.onCloseCalendar();
    }
  }

  mapDaysInView(callback) {
    let firstDateInView = this.getFirstSundayInView(this.firstDayOfMonthInView);
    let lastDateInView = this.getLastSaturdayInView(this.firstDayOfMonthInView);
    // Show an extra week (into the next month) if the current month only has
    // four weeks; this is so the calendar panel in the UI is always exactly the
    // same size
    if (lastDateInView.diff(firstDateInView, 'days') < (CalendarComponent.daysInWeek * 5)) {
      lastDateInView.add(1, 'week');
    }
    let currentDate = this.resetTime(firstDateInView.clone());
    let values = [];
    while (currentDate.isSameOrBefore(lastDateInView)) {
      values.push(callback(currentDate.clone()));
      currentDate.add(1, 'day');
    }
    return values;
  }

  view({attrs: {calendarOpen}}) {
    return this.firstDayOfMonthInView ? m('div.log-calendar', {
      class: calendarOpen ? 'open' : ''
    }, [

      m('div.dismissable-overlay', {onclick: () => this.onCloseCalendar()}),

      m('div.log-calendar-panel', [

        m('div.log-calendar-header', [
          m('span.log-calendar-current-month-name', this.firstDayOfMonthInView.format('MMMM YYYY')),
          m('div.log-calendar-month-controls', [
            m('button.log-calendar-month-control.log-calendar-prev-month-control', {
              onclick: () => this.viewPrevMonth()
            }, m(PrevIconComponent)),
            m('button.log-calendar-month-control.log-calendar-next-month-control', {
              onclick: () => this.viewNextMonth()
            }, m(NextIconComponent))
          ])
        ]),

        m('div.log-calendar-weekday-labels', this.weekdayLabels.map((weekdayLabel) => {
          return m('div.log-calendar-weekday-label', weekdayLabel);
        })),

        m('div.log-calendar-dates', {
          onmousedown: (event) => this.selectDate(event),
          ondblclick: (event) => this.closeCalendarAfterDblClickDate(event)
        }, this.mapDaysInView((currentDate) => {
          return m('div.log-calendar-date', {
            'data-date': currentDate.format('l'),
            class: [
              currentDate.format('YYYY/MM') === this.firstDayOfMonthInView.format('YYYY/MM') ? 'is-current-month' : '',
              currentDate.isSame(this.selectedDate) ? 'is-selected' : '',
              currentDate.isSame(this.getToday()) ? 'is-today' : ''
            ].join(' ')
          }, m('div.log-calendar-date-label', currentDate.date()));
        }))

      ])

    ]) : null;
  }

}
CalendarComponent.daysInWeek = 7;

export default CalendarComponent;
