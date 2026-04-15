import m from 'mithril';
import moment from 'moment';
import CalendarIconComponent from './calendar-icon.jsx';
import CalendarComponent from './calendar.jsx';

// Analytics-only custom date field built from three text inputs so each segment
// can receive native focus independently while still presenting as one control.
class DateInputComponent {
  oninit({ attrs }) {
    // Track whether the popup calendar is currently visible.
    this.calendarOpen = false;
    // Hold the delayed-close timer id used after selecting a date from the calendar.
    this.closeCalendarTimeoutId = null;
    // Keep references to the month/day/year inputs for keyboard-driven focus moves.
    this.segmentInputElements = {};
    // Remember which segment was focused most recently.
    this.activeSegment = 'month';
    // Buffer in-progress digit entry so month/day can show leading zeroes while
    // still allowing a second digit to replace the placeholder zero.
    this.segmentInputBuffer = '';
    this.segmentInputBufferSegment = null;
    this.segmentInputBufferUpdatedAt = 0;
    this.onbeforeupdate({ attrs });
  }

  onremove() {
    // Clean up async work so the component does not mutate state after unmount.
    this.clearCloseCalendarTimeout();
  }

  onbeforeupdate({ attrs: { value, onChange } }) {
    // The public value stays normalized as YYYY-MM-DD even though the field is
    // rendered and edited as segmented MM/DD/YYYY inputs.
    const parsedValue = moment(value, 'YYYY-MM-DD', true);
    if (parsedValue.isValid()) {
      const nextValue = parsedValue.format('YYYY-MM-DD');
      const currentValue = this.selectedDate
        ? this.selectedDate.format('YYYY-MM-DD')
        : null;
      if (nextValue !== currentValue) {
        this.selectedDate = parsedValue;
        this.syncSegmentInputsFromSelectedDate();
      }
    }
    this.value = value;
    this.onChange = onChange;
  }

  get segmentOrder() {
    // Canonical navigation order for keyboard movement across the three inputs.
    return ['month', 'day', 'year'];
  }

  getSegmentLength(segment) {
    // Month and day are two digits, while year is four digits.
    return segment === 'year' ? 4 : 2;
  }

  getSegmentInputValue(segment) {
    return this[`${segment}InputValue`] || '';
  }

  setSegmentInputValue(segment, value) {
    this[`${segment}InputValue`] = value;
  }

  setSegmentDisplayValue(segment, value) {
    // Update both component state and the live DOM input so the segment display
    // changes immediately even before the next redraw cycle completes.
    this.setSegmentInputValue(segment, value);

    const inputElement = this.segmentInputElements[segment];
    if (inputElement) {
      inputElement.value = value;
    }
  }

  syncSegmentInputsFromSelectedDate() {
    // Keep the visible segment strings in sync with the committed date.
    if (!this.selectedDate) {
      this.monthInputValue = '';
      this.dayInputValue = '';
      this.yearInputValue = '';
      return;
    }

    this.monthInputValue = this.selectedDate.format('MM');
    this.dayInputValue = this.selectedDate.format('DD');
    this.yearInputValue = this.selectedDate.format('YYYY');
  }

  setSegmentInputElement(segment, dom) {
    // Keep a direct reference because keyboard navigation moves focus imperatively.
    this.segmentInputElements[segment] = dom;
  }

  selectSegment(segment) {
    // Native date inputs highlight the whole active segment, so mirror that
    // behavior by selecting the entire segment input value.
    const inputElement = this.segmentInputElements[segment];
    if (!inputElement || document.activeElement !== inputElement) {
      return;
    }
    inputElement.select();
  }

  focusSegment(segment) {
    // Move focus to a sibling segment and immediately highlight it.
    const inputElement = this.segmentInputElements[segment];
    if (!inputElement) {
      return;
    }

    this.activeSegment = segment;
    inputElement.focus();
    inputElement.select();
  }

  resetSegmentInputBuffer() {
    // Discard any partially typed digits for the current segment.
    this.segmentInputBuffer = '';
    this.segmentInputBufferSegment = null;
    this.segmentInputBufferUpdatedAt = 0;
  }

  updateSegmentInputBuffer(segment, digit) {
    // Append digits typed in quick succession to the same segment; otherwise,
    // start a new segment edit.
    const now = Date.now();
    const shouldAppendToBuffer =
      this.segmentInputBufferSegment === segment &&
      now - this.segmentInputBufferUpdatedAt < 1500 &&
      this.segmentInputBuffer.length < this.getSegmentLength(segment);

    this.segmentInputBuffer = shouldAppendToBuffer
      ? `${this.segmentInputBuffer}${digit}`
      : digit;
    this.segmentInputBufferSegment = segment;
    this.segmentInputBufferUpdatedAt = now;
    return this.segmentInputBuffer;
  }

  getAdjacentSegment(segment, offset) {
    const currentIndex = this.segmentOrder.indexOf(segment);
    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= this.segmentOrder.length) {
      return null;
    }
    return this.segmentOrder[nextIndex];
  }

  normalizeSegmentInputValue(segment, inputValue) {
    // Strip any non-digit characters and clamp to the segment's maximum length.
    return inputValue
      .replace(/\D/g, '')
      .slice(0, this.getSegmentLength(segment));
  }

  getSegmentParts(date = this.selectedDate) {
    // Work with plain numeric parts when performing segment-level edits.
    return {
      month: date.month() + 1,
      day: date.date(),
      year: date.year()
    };
  }

  createDateFromParts({ month, day, year }) {
    // Clamp the resulting parts into a valid Gregorian date so edits like moving
    // from January 31 to February produce a valid last day of the month.
    const clampedYear = Math.max(1, year);
    const clampedMonth = Math.min(12, Math.max(1, month));
    const daysInMonth = moment([clampedYear, clampedMonth - 1]).daysInMonth();
    const clampedDay = Math.min(daysInMonth, Math.max(1, day));
    return moment([clampedYear, clampedMonth - 1, clampedDay]);
  }

  commitSelectedDate(selectedDate) {
    // Persist the canonical date back to the parent component in normalized form.
    const nextValue = selectedDate.format('YYYY-MM-DD');
    const didValueChange = nextValue !== this.value;

    this.selectedDate = selectedDate.clone();
    this.syncSegmentInputsFromSelectedDate();
    this.value = nextValue;

    if (didValueChange) {
      this.onChange(this.value);
    }
  }

  commitSegmentValue(segment, segmentValue) {
    // Apply an edited segment while preserving the other two segments.
    const parts = this.getSegmentParts();
    if (segment === 'month') {
      parts.month = Math.min(12, Math.max(1, segmentValue));
    } else if (segment === 'day') {
      const daysInMonth = moment([parts.year, parts.month - 1]).daysInMonth();
      parts.day = Math.min(daysInMonth, Math.max(1, segmentValue));
    } else {
      parts.year = Math.max(1, segmentValue);
    }
    this.commitSelectedDate(this.createDateFromParts(parts));
  }

  incrementSegment(segment, delta) {
    // Arrow keys step the active segment and wrap month/day like native desktop
    // date fields while clamping year at 1.
    const parts = this.getSegmentParts();

    if (segment === 'month') {
      parts.month = ((parts.month - 1 + delta + 12) % 12) + 1;
    } else if (segment === 'day') {
      const daysInMonth = moment([parts.year, parts.month - 1]).daysInMonth();
      parts.day = ((parts.day - 1 + delta + daysInMonth) % daysInMonth) + 1;
    } else {
      parts.year = Math.max(1, parts.year + delta);
    }

    this.commitSelectedDate(this.createDateFromParts(parts));
    this.focusSegment(segment);
  }

  shouldWaitForSecondDigit(segment, normalizedValue) {
    // Month/day allow a brief pause after digits that could still lead to a
    // valid two-digit value, such as 0_, 1_, 2_, or 3_.
    const numericValue = parseInt(normalizedValue, 10);
    return (
      normalizedValue.length === 1 &&
      (normalizedValue === '0' ||
        (segment === 'month' && numericValue <= 1) ||
        (segment === 'day' && numericValue <= 3))
    );
  }

  finalizeSegment(segment) {
    // Commit a partially edited segment when focus leaves it, or revert to the
    // last valid committed date if the segment is left empty.
    const normalizedValue = this.normalizeSegmentInputValue(
      segment,
      this.getSegmentInputValue(segment)
    );

    if (!normalizedValue) {
      this.resetSegmentInputBuffer();
      this.syncSegmentInputsFromSelectedDate();
      return;
    }

    this.commitSegmentValue(segment, parseInt(normalizedValue, 10));
    this.resetSegmentInputBuffer();
  }

  handleSegmentDigit(segment, digit) {
    // Numeric typing is handled explicitly so month/day can display a padded
    // leading zero while still waiting for a possible second digit.
    const bufferedValue = this.updateSegmentInputBuffer(segment, digit);

    if (segment === 'year') {
      this.setSegmentDisplayValue(segment, bufferedValue);
      if (bufferedValue.length === 4) {
        this.commitSegmentValue('year', parseInt(bufferedValue, 10));
        this.resetSegmentInputBuffer();
      }
      this.selectSegment(segment);
      return;
    }

    if (bufferedValue.length === 1) {
      this.setSegmentDisplayValue(segment, bufferedValue.padStart(2, '0'));
      if (this.shouldWaitForSecondDigit(segment, bufferedValue)) {
        this.selectSegment(segment);
        return;
      }
    }

    this.commitSegmentValue(segment, parseInt(bufferedValue, 10));
    this.resetSegmentInputBuffer();

    const nextSegment = this.getAdjacentSegment(segment, 1);
    if (nextSegment) {
      this.focusSegment(nextSegment);
    }
  }

  parseAcceptedDateInput(inputValue) {
    // Paste still accepts a few common date formats and normalizes them back
    // into the field's canonical display format.
    const parsedValue = moment(
      inputValue,
      ['MM/DD/YYYY', 'M/D/YYYY', 'YYYY-MM-DD'],
      true
    );
    return parsedValue.isValid() ? parsedValue : null;
  }

  toggleCalendar() {
    // Toggle from the calendar button without leaving stale delayed-close timers.
    this.clearCloseCalendarTimeout();
    this.calendarOpen = !this.calendarOpen;
  }

  closeCalendar() {
    // Close immediately, typically after outside clicks.
    this.clearCloseCalendarTimeout();
    this.calendarOpen = false;
  }

  clearCloseCalendarTimeout() {
    // Ensure only one delayed-close timer exists at a time.
    if (this.closeCalendarTimeoutId) {
      window.clearTimeout(this.closeCalendarTimeoutId);
      this.closeCalendarTimeoutId = null;
    }
  }

  closeCalendarWithDelay() {
    // Leave the calendar visible briefly after selecting a date so the click
    // feels acknowledged before the popup disappears.
    this.clearCloseCalendarTimeout();
    this.closeCalendarTimeoutId = window.setTimeout(() => {
      this.calendarOpen = false;
      this.closeCalendarTimeoutId = null;
      m.redraw();
    }, 250);
  }

  handleSegmentFocus(segment) {
    // Focusing any segment should highlight its full value.
    if (this.activeSegment !== segment) {
      this.resetSegmentInputBuffer();
    }
    this.activeSegment = segment;
    this.selectSegment(segment);
  }

  handleSegmentMouseDown(segment) {
    // Remember the clicked segment as soon as the pointer goes down so the
    // browser's natural focus target and the component's active segment match.
    this.activeSegment = segment;
  }

  handleSegmentMouseUp(segment, event) {
    // Re-select the whole segment after click placement so the field still feels
    // like one segmented date input instead of three freeform text fields.
    if (document.activeElement === event.target) {
      this.activeSegment = segment;
      event.preventDefault();
      event.target.select();
    }
  }

  handleSegmentBlur(segment) {
    // Normalize or revert partial edits whenever a segment loses focus.
    this.finalizeSegment(segment);
  }

  handleSegmentInput(segment, event) {
    // Sanitize typed digits and progressively commit or auto-advance when the
    // segment has enough information to become a valid date part.
    this.resetSegmentInputBuffer();

    const normalizedValue = this.normalizeSegmentInputValue(
      segment,
      event.target.value
    );
    this.setSegmentInputValue(segment, normalizedValue);

    if (!normalizedValue) {
      return;
    }

    if (segment === 'year') {
      this.setSegmentDisplayValue(segment, normalizedValue);
      if (normalizedValue.length === 4) {
        this.commitSegmentValue('year', parseInt(normalizedValue, 10));
      }
      return;
    }

    if (normalizedValue.length === 1) {
      this.setSegmentDisplayValue(segment, normalizedValue.padStart(2, '0'));
    }

    if (this.shouldWaitForSecondDigit(segment, normalizedValue)) {
      this.segmentInputBuffer = normalizedValue;
      this.segmentInputBufferSegment = segment;
      this.segmentInputBufferUpdatedAt = Date.now();
      this.selectSegment(segment);
      return;
    }

    this.commitSegmentValue(segment, parseInt(normalizedValue, 10));
    const nextSegment = this.getAdjacentSegment(segment, 1);
    if (nextSegment) {
      this.focusSegment(nextSegment);
    }
  }

  handleSegmentKeyDown(segment, event) {
    // The field owns navigation semantics between segments while leaving normal
    // text editing to the focused segment input.
    if (!this.selectedDate) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      this.handleSegmentDigit(segment, event.key);
      return;
    }

    if (event.key === 'ArrowLeft') {
      const previousSegment = this.getAdjacentSegment(segment, -1);
      if (previousSegment) {
        event.preventDefault();
        this.finalizeSegment(segment);
        this.focusSegment(previousSegment);
      }
      return;
    }

    if (event.key === 'ArrowRight') {
      const nextSegment = this.getAdjacentSegment(segment, 1);
      if (nextSegment) {
        event.preventDefault();
        this.finalizeSegment(segment);
        this.focusSegment(nextSegment);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.incrementSegment(segment, 1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.incrementSegment(segment, -1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.focusSegment('month');
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.focusSegment('year');
      return;
    }

    if (event.key === 'Tab') {
      const nextSegment = this.getAdjacentSegment(
        segment,
        event.shiftKey ? -1 : 1
      );
      this.finalizeSegment(segment);
      if (nextSegment) {
        event.preventDefault();
        this.focusSegment(nextSegment);
      }
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      this.resetSegmentInputBuffer();
    }
  }

  handleSegmentPaste(event) {
    // Normalized paste support keeps the custom field usable for power users.
    const pastedText = event.clipboardData.getData('text');
    const parsedValue = this.parseAcceptedDateInput(pastedText);
    if (!parsedValue) {
      return;
    }

    event.preventDefault();
    this.commitSelectedDate(parsedValue);
  }

  setSelectedDate(selectedDate) {
    // Calendar selections flow through the same commit path as keyboard edits.
    this.commitSelectedDate(selectedDate);
    this.closeCalendarWithDelay();
  }

  view({ attrs }) {
    // The component exposes only an aria-label; styling and behavior are owned
    // internally so consumers cannot accidentally break the segmented UX.
    const ariaLabel = attrs['aria-label'];
    return (
      <div className="date-input" role="group" aria-label={ariaLabel}>
        <input
          type="text"
          inputmode="numeric"
          className="date-input-segment date-input-segment-month"
          aria-label={`${ariaLabel} Month`}
          maxlength="2"
          value={this.monthInputValue}
          onfocus={() => this.handleSegmentFocus('month')}
          onblur={() => this.handleSegmentBlur('month')}
          onmousedown={() => this.handleSegmentMouseDown('month')}
          onmouseup={(event) => this.handleSegmentMouseUp('month', event)}
          onkeydown={(event) => this.handleSegmentKeyDown('month', event)}
          oninput={(event) => this.handleSegmentInput('month', event)}
          onpaste={(event) => this.handleSegmentPaste(event)}
          oncreate={({ dom }) => this.setSegmentInputElement('month', dom)}
          onupdate={({ dom }) => this.setSegmentInputElement('month', dom)}
        />
        <span className="date-input-separator">/</span>
        <input
          type="text"
          inputmode="numeric"
          className="date-input-segment date-input-segment-day"
          aria-label={`${ariaLabel} Day`}
          maxlength="2"
          value={this.dayInputValue}
          onfocus={() => this.handleSegmentFocus('day')}
          onblur={() => this.handleSegmentBlur('day')}
          onmousedown={() => this.handleSegmentMouseDown('day')}
          onmouseup={(event) => this.handleSegmentMouseUp('day', event)}
          onkeydown={(event) => this.handleSegmentKeyDown('day', event)}
          oninput={(event) => this.handleSegmentInput('day', event)}
          onpaste={(event) => this.handleSegmentPaste(event)}
          oncreate={({ dom }) => this.setSegmentInputElement('day', dom)}
          onupdate={({ dom }) => this.setSegmentInputElement('day', dom)}
        />
        <span className="date-input-separator">/</span>
        <input
          type="text"
          inputmode="numeric"
          className="date-input-segment date-input-segment-year"
          aria-label={`${ariaLabel} Year`}
          maxlength="4"
          value={this.yearInputValue}
          onfocus={() => this.handleSegmentFocus('year')}
          onblur={() => this.handleSegmentBlur('year')}
          onmousedown={() => this.handleSegmentMouseDown('year')}
          onmouseup={(event) => this.handleSegmentMouseUp('year', event)}
          onkeydown={(event) => this.handleSegmentKeyDown('year', event)}
          oninput={(event) => this.handleSegmentInput('year', event)}
          onpaste={(event) => this.handleSegmentPaste(event)}
          oncreate={({ dom }) => this.setSegmentInputElement('year', dom)}
          onupdate={({ dom }) => this.setSegmentInputElement('year', dom)}
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
              // Clicking the calendar toggle button should not be treated as an
              // outside click by the popup close handler.
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
