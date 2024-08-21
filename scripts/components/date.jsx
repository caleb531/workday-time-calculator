import moment from 'moment';
import CalendarIconComponent from './calendar-icon.jsx';
import CalendarComponent from './calendar.jsx';
import NextIconComponent from './next-icon.jsx';
import PrevIconComponent from './prev-icon.jsx';

class DateComponent {
  oninit({ attrs: { selectedDate, onSetSelectedDate } }) {
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
            selectedDate={this.selectedDate}
            calendarOpen={this.calendarOpen}
            onSetSelectedDate={(selectedDate) => {
              this.selectedDate = selectedDate.clone();
              this.onSetSelectedDate(this.selectedDate);
            }}
            onCloseCalendar={() => {
              this.calendarOpen = false;
            }}
          />
        ) : null}
      </div>
    );
  }
}

export default DateComponent;
