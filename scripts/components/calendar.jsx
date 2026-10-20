import clsx from 'clsx';
import m from 'mithril';
import moment from 'moment';
import appStorage from '../models/app-storage.js';
import NextIconComponent from './next-icon.jsx';
import PrevIconComponent from './prev-icon.jsx';

// Render a nonmodal calendar with separate selected and keyboard-focused dates
class CalendarComponent {
  // Set up one storage-key snapshot and outside-click handling for this opening
  oninit({ attrs: { selectedDate, onSetSelectedDate, onCloseCalendar } }) {
    // Saved keys mark dates without reading individual log contents
    this.logKeys = new Set();
    appStorage
      .keys()
      .then((keys) => {
        this.logKeys = new Set(keys);
        m.redraw();
      })
      .catch(() => {
        // Keep navigation available if storage cannot be read
      });
    // Labels follow the Sunday-first grid
    this.weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    this.onSetSelectedDate = onSetSelectedDate;
    this.onCloseCalendar = onCloseCalendar;
    this.onbeforeupdate({ attrs: { selectedDate } });
    this.onDocumentMouseDown = (event) => {
      if (
        !this.calendarRootElement ||
        this.calendarRootElement.contains(event.target)
      ) {
        return;
      }
      if (
        this.onShouldIgnoreOutsideClick &&
        this.onShouldIgnoreOutsideClick(event.target)
      ) {
        return;
      }
      this.onCloseCalendar('outside');
      m.redraw();
    };
  }

  // Focus the selected date only when the popup first appears
  oncreate({ dom }) {
    this.calendarRootElement = dom;
    document.addEventListener('click', this.onDocumentMouseDown);
    this.focusDate();
  }

  // Remove the document listener when the popup closes
  onremove() {
    document.removeEventListener('click', this.onDocumentMouseDown);
  }

  // Follow external selections without coupling keyboard navigation to log loading
  onbeforeupdate({ attrs: { selectedDate, onShouldIgnoreOutsideClick } }) {
    selectedDate = selectedDate.clone().startOf('day');
    this.onShouldIgnoreOutsideClick = onShouldIgnoreOutsideClick;
    if (!this.selectedDate || !selectedDate.isSame(this.selectedDate)) {
      this.selectedDate = selectedDate.startOf('day');
      // Keyboard navigation starts at the current selection
      this.focusedDate = this.selectedDate.clone();
      this.firstDayOfMonthInView = this.getFirstDayOfMonth(this.selectedDate);
    }
  }

  // Return today at midnight for date comparisons
  getToday() {
    return moment().startOf('day');
  }

  // Return the first day of the given month
  getFirstDayOfMonth(date) {
    return date.clone().date(1);
  }

  // Return the Sunday starting the first visible week
  getFirstSundayInView(date) {
    return date.clone().date(1).weekday(0);
  }
  // Return the Saturday ending the last week of the month
  getLastSaturdayInView(date) {
    return date.clone().date(date.daysInMonth()).weekday(6);
  }

  // Change the viewed month while leaving month controls focused
  changeMonth(offset) {
    this.firstDayOfMonthInView.add(offset, 'month');
  }

  // Focus the chosen date after opening or navigating the calendar
  focusDate() {
    this.calendarRootElement
      .querySelector(`[data-date="${this.focusedDate.format('l')}"]`)
      ?.focus();
  }

  // Move through dates without selecting a log; native button clicks handle Enter and Space
  navigateDate(event) {
    // The next focused date starts at the button receiving the key
    const date = this.focusedDate.clone();
    switch (event.key) {
      case 'ArrowLeft':
        date.subtract(1, 'day');
        break;
      case 'ArrowRight':
        date.add(1, 'day');
        break;
      case 'ArrowUp':
        date.subtract(1, 'week');
        break;
      case 'ArrowDown':
        date.add(1, 'week');
        break;
      case 'Home':
        date.day(0);
        break;
      case 'End':
        date.day(6);
        break;
      case 'PageUp':
        date.subtract(1, event.shiftKey ? 'year' : 'month');
        break;
      case 'PageDown':
        date.add(1, event.shiftKey ? 'year' : 'month');
        break;
      default:
        return;
    }
    event.preventDefault();
    this.focusedDate = date;
    this.firstDayOfMonthInView = this.getFirstDayOfMonth(date);
    // Finish the move in this key event so a later redraw cannot reclaim focus
    m.redraw.sync();
    this.focusDate();
  }

  // Select a log only after activating a date button
  selectDate(date) {
    this.selectedDate = date.clone();
    this.focusedDate = date.clone();
    this.firstDayOfMonthInView = this.getFirstDayOfMonth(date);
    this.onSetSelectedDate(date.clone());
    // Keep focus on the chosen date if selecting a trailing day changes the month
    m.redraw.sync();
    this.focusDate();
  }

  // Return the visible dates, including enough weeks to preserve the panel size
  mapDaysInView(callback) {
    // The first and last days cover complete Sunday-to-Saturday weeks
    let firstDateInView = this.getFirstSundayInView(this.firstDayOfMonthInView);
    // The last visible Saturday includes trailing dates from the next month
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
    // Walk each visible date once
    let currentDate = firstDateInView.clone().startOf('day');
    // Rendered values in chronological order
    let values = [];
    while (currentDate.isSameOrBefore(lastDateInView)) {
      values.push(callback(currentDate.clone()));
      currentDate.add(1, 'day');
    }
    return values;
  }

  // Render semantic rows and cells with native date buttons
  view({ attrs: { calendarOpen, className, id } }) {
    // Group the visible dates into complete weeks for grid semantics
    const dates = this.mapDaysInView((date) => date);
    // Each row contains exactly seven dates
    const weeks = [];
    for (let index = 0; index < dates.length; index += 7) {
      weeks.push(dates.slice(index, index + 7));
    }
    return this.firstDayOfMonthInView ? (
      <div
        id={id}
        role="dialog"
        aria-label="Choose date"
        onkeydown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.onCloseCalendar('escape');
          }
        }}
        className={clsx('log-calendar', className, {
          'log-calendar-open': calendarOpen
        })}
      >
        <div className="log-calendar-panel">
          <div className="log-calendar-header">
            <span
              className="log-calendar-current-month-name"
              aria-live="polite"
            >
              {this.firstDayOfMonthInView.format('MMMM YYYY')}
            </span>
            <div className="log-calendar-month-controls">
              <button
                aria-label="Previous Month"
                onclick={() => this.changeMonth(-1)}
                className="log-calendar-month-control log-calendar-prev-month-control"
              >
                <PrevIconComponent />
              </button>
              <button
                aria-label="Next Month"
                onclick={() => this.changeMonth(1)}
                className="log-calendar-month-control log-calendar-next-month-control"
              >
                <NextIconComponent />
              </button>
            </div>
          </div>

          <div
            role="grid"
            aria-label={this.firstDayOfMonthInView.format('MMMM YYYY')}
          >
            <div className="log-calendar-weekday-labels" role="row">
              {this.weekdayLabels.map((label, index) => (
                <div
                  className="log-calendar-weekday-label"
                  role="columnheader"
                  aria-label={moment().day(index).format('dddd')}
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="log-calendar-dates"
              data-testid="log-calendar-dates"
              role="rowgroup"
            >
              {weeks.map((week) => (
                <div role="row" className="log-calendar-week">
                  {week.map((date) => {
                    // A saved daily-log key is sufficient to show an indicator
                    const hasLog = this.logKeys.has(
                      `wtc-date-${date.format('l')}`
                    );
                    return (
                      <div
                        role="gridcell"
                        aria-selected={
                          date.isSame(this.selectedDate) ? 'true' : 'false'
                        }
                      >
                        <button
                          type="button"
                          data-date={date.format('l')}
                          data-testid={
                            date.isSame(this.selectedDate)
                              ? 'log-calendar-selected-date'
                              : undefined
                          }
                          aria-label={`${date.format('dddd, MMMM D, YYYY')}${hasLog ? ', has log' : ''}`}
                          aria-current={
                            date.isSame(this.getToday()) ? 'date' : undefined
                          }
                          className={clsx('log-calendar-date', {
                            'is-current-month': date.isSame(
                              this.firstDayOfMonthInView,
                              'month'
                            ),
                            'is-selected': date.isSame(this.selectedDate),
                            'is-today': date.isSame(this.getToday()),
                            'has-log': hasLog
                          })}
                          onfocus={() => {
                            this.focusedDate = date.clone();
                          }}
                          onkeydown={(event) => this.navigateDate(event)}
                          onclick={() => this.selectDate(date)}
                          ondblclick={() => this.onCloseCalendar('selection')}
                        >
                          <span className="log-calendar-date-label">
                            {date.date()}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : null;
  }
}
// The number of days in each calendar row
CalendarComponent.daysInWeek = 7;

export default CalendarComponent;
