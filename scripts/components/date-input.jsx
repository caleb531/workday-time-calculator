import m from 'mithril';
import moment from 'moment';
import CalendarIconComponent from './calendar-icon.jsx';
import CalendarComponent from './calendar.jsx';

class DateInputComponent {
  oninit({ attrs }) {
    this.calendarOpen = false;
    this.closeCalendarTimeoutId = null;
    this.isInputFocused = false;
    this.onbeforeupdate({ attrs });
  }

  onremove() {
    this.clearCloseCalendarTimeout();
  }

  onbeforeupdate({ attrs: { value, onChange } }) {
    const parsedValue = moment(value, 'YYYY-MM-DD', true);
    if (parsedValue.isValid()) {
      this.selectedDate = parsedValue;
      if (!this.isInputFocused) {
        this.inputValue = parsedValue.format('MM/DD/YYYY');
      }
    } else if (!this.isInputFocused) {
      this.inputValue = '';
    }
    this.value = value;
    this.onChange = onChange;
  }

  toggleCalendar() {
    this.clearCloseCalendarTimeout();
    this.calendarOpen = !this.calendarOpen;
  }

  closeCalendar() {
    this.clearCloseCalendarTimeout();
    this.calendarOpen = false;
  }

  clearCloseCalendarTimeout() {
    if (this.closeCalendarTimeoutId) {
      window.clearTimeout(this.closeCalendarTimeoutId);
      this.closeCalendarTimeoutId = null;
    }
  }

  closeCalendarWithDelay() {
    this.clearCloseCalendarTimeout();
    this.closeCalendarTimeoutId = window.setTimeout(() => {
      this.calendarOpen = false;
      this.closeCalendarTimeoutId = null;
      m.redraw();
    }, 250);
  }

  openCalendar() {
    this.clearCloseCalendarTimeout();
    this.calendarOpen = true;
  }

  handleInput(event) {
    const inputValue = event.target.value;
    this.inputValue = inputValue;
    const parsedValue = moment(inputValue, 'M/D/YYYY');
    if (parsedValue.isValid()) {
      this.selectedDate = parsedValue;
      this.value = parsedValue.format('YYYY-MM-DD');
      this.onChange(this.value);
    }
  }

  handleBlur() {
    this.isInputFocused = false;
    if (this.selectedDate) {
      this.inputValue = this.selectedDate.format('MM/DD/YYYY');
    }
  }

  handleFocus() {
    this.isInputFocused = true;
  }

  setSelectedDate(selectedDate) {
    this.selectedDate = selectedDate.clone();
    this.value = this.selectedDate.format('YYYY-MM-DD');
    this.inputValue = this.selectedDate.format('MM/DD/YYYY');
    this.onChange(this.value);
    this.closeCalendarWithDelay();
  }

  view({ attrs }) {
    const ariaLabel = attrs['aria-label'];
    return (
      <div className="date-input">
        <input
          type="text"
          className="date-input-input"
          aria-label={ariaLabel}
          placeholder="MM/DD/YYYY"
          aria-haspopup="dialog"
          aria-expanded={this.calendarOpen ? 'true' : 'false'}
          value={this.inputValue}
          onfocus={() => this.handleFocus()}
          onblur={() => this.handleBlur()}
          oninput={(event) => this.handleInput(event)}
        />
        <button
          type="button"
          className="date-input-calendar-toggle"
          aria-label={`Open ${ariaLabel} Calendar`}
          aria-haspopup="dialog"
          aria-expanded={this.calendarOpen ? 'true' : 'false'}
          onclick={() => this.toggleCalendar()}
        >
          <CalendarIconComponent selectedDate={this.selectedDate} />
        </button>

        {this.selectedDate && this.calendarOpen ? (
          <CalendarComponent
            className="date-input-calendar"
            selectedDate={this.selectedDate}
            calendarOpen={this.calendarOpen}
            onShouldIgnoreOutsideClick={(target) => {
              let element = target;
              while (element && element !== document) {
                if (
                  element.classList &&
                  element.classList.contains('date-input-calendar-toggle')
                ) {
                  return true;
                }
                element = element.parentNode;
              }
              return false;
            }}
            onSetSelectedDate={(selectedDate) => {
              this.setSelectedDate(selectedDate);
            }}
            onCloseCalendar={() => {
              this.closeCalendar();
            }}
          />
        ) : null}
      </div>
    );
  }
}

export default DateInputComponent;
