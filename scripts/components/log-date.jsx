import moment from 'moment';
import CalendarIconComponent from './calendar-icon.jsx';
import CalendarComponent from './calendar.jsx';
import NextIconComponent from './next-icon.jsx';
import PrevIconComponent from './prev-icon.jsx';

class LogDateComponent {
  oninit({ attrs: { selectedDate, onSetSelectedDate, onFocusEditor } }) {
    this.selectedDate = selectedDate.clone();
    this.onSetSelectedDate = onSetSelectedDate;
    // Let the app resume editing after day navigation or calendar dismissal
    this.onFocusEditor = onFocusEditor;
    this.calendarOpen = false;
  }

  // Load the previous day and return focus to the editor
  selectPrevDay() {
    this.selectedDate.subtract(1, 'day');
    this.onSetSelectedDate(this.selectedDate);
    this.onFocusEditor();
  }

  // Load the next day and return focus to the editor
  selectNextDay() {
    this.selectedDate.add(1, 'day');
    this.onSetSelectedDate(this.selectedDate);
    this.onFocusEditor();
  }

  toggleCalendar() {
    if (this.calendarOpen) {
      this.closeCalendar('toggle');
    } else {
      this.calendarOpen = true;
    }
  }

  // Resume editing after explicit dismissal while preserving outside-click focus
  closeCalendar(reason) {
    this.calendarOpen = false;
    if (reason !== 'outside') {
      this.onFocusEditor();
    }
  }

  formatRelativeMessage(message) {
    const alternativeMessages = {
      'a day ago': 'yesterday',
      'in a day': 'tomorrow'
    };
    return alternativeMessages[message] || message;
  }

  view() {
    return (
      <div className="log-date-area">
        <div className="log-date-controls">
          <button
            className="log-date-control log-date-prev-control"
            aria-label="Go To Previous Day"
            onclick={() => this.selectPrevDay()}
          >
            <PrevIconComponent />
          </button>
          <button
            className={`log-date-control log-date-calendar-control ${this.calendarOpen ? 'active' : ''}`}
            aria-label="Toggle Calendar"
            aria-haspopup="dialog"
            aria-expanded={this.calendarOpen ? 'true' : 'false'}
            aria-controls="daily-log-calendar"
            onclick={() => this.toggleCalendar()}
          >
            <CalendarIconComponent selectedDate={this.selectedDate} />
          </button>
          <button
            className="log-date-control log-date-next-control"
            aria-label="Go To Next Day"
            onclick={() => this.selectNextDay()}
          >
            <NextIconComponent />
          </button>
        </div>
        <div className="log-selected-date">
          <div className="log-selected-date-absolute">
            {this.selectedDate.format('dddd, MMMM D, YYYY')}
          </div>
          <div className="log-selected-date-relative">
            {this.selectedDate.isSame(moment(), 'day')
              ? 'today'
              : `${this.formatRelativeMessage(this.selectedDate.fromNow())}`}
          </div>
        </div>

        {this.selectedDate && this.calendarOpen ? (
          <CalendarComponent
            id="daily-log-calendar"
            selectedDate={this.selectedDate}
            calendarOpen={this.calendarOpen}
            onShouldIgnoreOutsideClick={(target) => {
              let element = target;
              while (element && element !== document) {
                if (
                  element.classList &&
                  element.classList.contains('log-date-calendar-control')
                ) {
                  return true;
                }
                element = element.parentNode;
              }
              return false;
            }}
            onSetSelectedDate={(selectedDate) => {
              this.selectedDate = selectedDate.clone();
              this.onSetSelectedDate(this.selectedDate);
            }}
            onCloseCalendar={(reason) => this.closeCalendar(reason)}
          />
        ) : null}
      </div>
    );
  }
}

export default LogDateComponent;
