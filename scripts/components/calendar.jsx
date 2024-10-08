import clsx from 'clsx';
import moment from 'moment';
import DismissableOverlayComponent from './dismissable-overlay.jsx';
import NextIconComponent from './next-icon.jsx';
import PrevIconComponent from './prev-icon.jsx';

class CalendarComponent {
  oninit({ attrs: { selectedDate, onSetSelectedDate, onCloseCalendar } }) {
    this.weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    this.onSetSelectedDate = onSetSelectedDate;
    this.onCloseCalendar = onCloseCalendar;
    this.onbeforeupdate({ attrs: { selectedDate } });
  }

  onbeforeupdate({ attrs: { selectedDate } }) {
    selectedDate = selectedDate.clone().startOf('day');
    if (!this.selectedDate || !selectedDate.isSame(this.selectedDate)) {
      this.selectedDate = selectedDate.startOf('day');
      this.firstDayOfMonthInView = this.getFirstDayOfMonth(this.selectedDate);
    }
  }

  getToday() {
    return moment().startOf('day');
  }

  getFirstDayOfMonth(date) {
    return date.clone().date(1);
  }

  getFirstSundayInView(date) {
    return date.clone().date(1).weekday(0);
  }
  getLastSaturdayInView(date) {
    return date.clone().date(date.daysInMonth()).weekday(6);
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
    } else {
      event.redraw = false;
    }
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
    if (
      lastDateInView.diff(firstDateInView, 'days') <
      CalendarComponent.daysInWeek * 5
    ) {
      lastDateInView.add(1, 'week');
    }
    let currentDate = firstDateInView.clone().startOf('day');
    let values = [];
    while (currentDate.isSameOrBefore(lastDateInView)) {
      values.push(callback(currentDate.clone()));
      currentDate.add(1, 'day');
    }
    return values;
  }

  view({ attrs: { calendarOpen } }) {
    return this.firstDayOfMonthInView ? (
      <div
        className={clsx('log-calendar', { 'log-calendar-open': calendarOpen })}
      >
        <DismissableOverlayComponent
          aria-label="Close Calendar"
          onDismiss={() => this.onCloseCalendar()}
        />

        <div className="log-calendar-panel">
          <div className="log-calendar-header">
            <span className="log-calendar-current-month-name">
              {this.firstDayOfMonthInView.format('MMMM YYYY')}
            </span>
            <div className="log-calendar-month-controls">
              <button
                aria-label="Previous Month"
                onclick={() => this.viewPrevMonth()}
                className="log-calendar-month-control log-calendar-prev-month-control"
              >
                <PrevIconComponent />
              </button>
              <button
                aria-label="Next Month"
                onclick={() => this.viewNextMonth()}
                className="log-calendar-month-control log-calendar-next-month-control"
              >
                <NextIconComponent />
              </button>
            </div>
          </div>

          <div className="log-calendar-weekday-labels">
            {this.weekdayLabels.map((weekdayLabel) => {
              return (
                <div className="log-calendar-weekday-label">{weekdayLabel}</div>
              );
            })}
          </div>

          <div
            className="log-calendar-dates"
            data-testid="log-calendar-dates"
            onmousedown={(event) => this.selectDate(event)}
            ondblclick={(event) => this.closeCalendarAfterDblClickDate(event)}
          >
            {this.mapDaysInView((currentDate) => {
              return (
                <div
                  data-date={currentDate.format('l')}
                  data-testid={
                    currentDate.isSame(this.selectedDate)
                      ? 'log-calendar-selected-date'
                      : undefined
                  }
                  className={clsx('log-calendar-date', {
                    'is-current-month':
                      currentDate.format('YYYY/MM') ===
                      this.firstDayOfMonthInView.format('YYYY/MM'),
                    'is-selected': currentDate.isSame(this.selectedDate),
                    'is-today': currentDate.isSame(this.getToday())
                  })}
                >
                  <div className="log-calendar-date-label">
                    {currentDate.date()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ) : null;
  }
}
CalendarComponent.daysInWeek = 7;

export default CalendarComponent;
