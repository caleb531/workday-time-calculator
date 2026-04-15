import m from 'mithril';
import moment from 'moment';
import CalendarIconComponent from './calendar-icon.jsx';
import CalendarComponent from './calendar.jsx';

// Analytics-only custom date field that emulates native segmented date editing
// while still using the app's custom calendar popup.
class DateInputComponent {
  oninit({ attrs }) {
    // Track whether the popup calendar is currently visible.
    this.calendarOpen = false;
    // Hold the delayed-close timer id used after selecting a date from the calendar.
    this.closeCalendarTimeoutId = null;
    // Remember focus state so segment selection can be restored after redraws.
    this.isInputFocused = false;
    // The currently selected editable segment inside the MM/DD/YYYY display.
    this.activeSegment = 'month';
    // Buffer numeric keystrokes so segments can be typed progressively.
    this.segmentInputBuffer = '';
    // Record which segment owns the current buffered digits.
    this.segmentInputBufferSegment = null;
    // Timestamp the last buffered keystroke to decide whether to append or restart.
    this.segmentInputBufferUpdatedAt = 0;
    // Schedule selection updates after Mithril redraws and browser focus changes.
    this.selectionFrameId = null;
    this.onbeforeupdate({ attrs });
  }

  onremove() {
    // Clean up async work so the component does not mutate state after unmount.
    this.clearCloseCalendarTimeout();
    this.clearScheduledSelection();
  }

  onbeforeupdate({ attrs: { value, onChange } }) {
    // The public value stays normalized as YYYY-MM-DD even though the field is
    // rendered and edited as MM/DD/YYYY.
    const parsedValue = moment(value, 'YYYY-MM-DD', true);
    if (parsedValue.isValid()) {
      this.selectedDate = parsedValue;
    }
    this.value = value;
    this.onChange = onChange;
  }

  clearScheduledSelection() {
    // Cancel the pending segment-selection frame when a newer one supersedes it.
    if (this.selectionFrameId) {
      window.cancelAnimationFrame(this.selectionFrameId);
      this.selectionFrameId = null;
    }
  }

  scheduleActiveSegmentSelection() {
    // Selection needs to happen after focus, click, and redraw side effects have
    // settled, otherwise the browser may immediately overwrite it.
    this.clearScheduledSelection();
    this.selectionFrameId = window.requestAnimationFrame(() => {
      this.selectionFrameId = null;
      this.selectActiveSegment();
    });
  }

  scheduleSegmentSelectionFromCaret(caretPosition) {
    // Clicking the input should choose a segment immediately, but the browser
    // may not have finalized the caret position until after mousedown logic
    // finishes. Re-resolve the segment on the next frame using the latest caret.
    this.clearScheduledSelection();
    this.selectionFrameId = window.requestAnimationFrame(() => {
      this.selectionFrameId = null;
      this.activeSegment = this.getSegmentFromCaretPosition(caretPosition());
      this.selectActiveSegment();
    });
  }

  setInputElement(dom) {
    // Keep a direct reference because selection is managed imperatively.
    this.inputElement = dom;
    if (this.isInputFocused) {
      this.scheduleActiveSegmentSelection();
    }
  }

  get segmentRanges() {
    // Character ranges for each editable segment within MM/DD/YYYY.
    return {
      month: [0, 2],
      day: [3, 5],
      year: [6, 10]
    };
  }

  get segmentOrder() {
    // Canonical navigation order for arrow-key movement across segments.
    return ['month', 'day', 'year'];
  }

  getSegmentLength(segment) {
    // Month and day are two digits, while year is four digits.
    return segment === 'year' ? 4 : 2;
  }

  getDisplayValue() {
    // Render the currently committed date, optionally overlaying any in-progress
    // buffered digits for the active segment.
    if (!this.selectedDate) {
      return '';
    }

    let displayValue = this.selectedDate.format('MM/DD/YYYY');
    if (this.segmentInputBuffer && this.segmentInputBufferSegment) {
      displayValue = this.replaceSegmentInDisplayValue(
        displayValue,
        this.segmentInputBufferSegment,
        this.segmentInputBuffer
      );
    }
    return displayValue;
  }

  replaceSegmentInDisplayValue(displayValue, segment, segmentValue) {
    // Replace one segment without disturbing the slash separators or the other
    // committed segments in the display value.
    const [segmentStart, segmentEnd] = this.segmentRanges[segment];
    const paddedValue = segmentValue
      .padStart(this.getSegmentLength(segment), '0')
      .slice(-this.getSegmentLength(segment));
    return (
      displayValue.slice(0, segmentStart) +
      paddedValue +
      displayValue.slice(segmentEnd)
    );
  }

  selectActiveSegment() {
    // Keep the field feeling like a segmented control by always selecting the
    // whole active segment and never leaving behind a free-moving caret.
    if (!this.inputElement || document.activeElement !== this.inputElement) {
      return;
    }

    const [selectionStart, selectionEnd] =
      this.segmentRanges[this.activeSegment];
    this.inputElement.setSelectionRange(selectionStart, selectionEnd);
  }

  setActiveSegment(segment) {
    // Changing segments resets any half-entered numeric buffer so a new segment
    // always starts from a clean editing state.
    if (this.activeSegment !== segment) {
      this.resetSegmentInputBuffer();
    }
    this.activeSegment = segment;
    this.scheduleActiveSegmentSelection();
  }

  moveActiveSegment(offset) {
    // Move left or right while staying within the first and last segment.
    const currentIndex = this.segmentOrder.indexOf(this.activeSegment);
    const nextIndex = Math.min(
      this.segmentOrder.length - 1,
      Math.max(0, currentIndex + offset)
    );
    this.setActiveSegment(this.segmentOrder[nextIndex]);
  }

  getSegmentFromCaretPosition(caretPosition) {
    // Map click/caret positions back to the nearest logical segment.
    if (caretPosition <= 2) {
      return 'month';
    }
    if (caretPosition <= 5) {
      return 'day';
    }
    return 'year';
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
    this.selectedDate = selectedDate.clone();
    this.value = this.selectedDate.format('YYYY-MM-DD');
    this.onChange(this.value);
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

  incrementActiveSegment(delta) {
    // Arrow keys step the active segment and wrap month/day like native desktop
    // date fields while clamping year at 1.
    const parts = this.getSegmentParts();

    if (this.activeSegment === 'month') {
      parts.month = ((parts.month - 1 + delta + 12) % 12) + 1;
    } else if (this.activeSegment === 'day') {
      const daysInMonth = moment([parts.year, parts.month - 1]).daysInMonth();
      parts.day = ((parts.day - 1 + delta + daysInMonth) % daysInMonth) + 1;
    } else {
      parts.year = Math.max(1, parts.year + delta);
    }

    this.resetSegmentInputBuffer();
    this.commitSelectedDate(this.createDateFromParts(parts));
    this.scheduleActiveSegmentSelection();
  }

  resetSegmentInputBuffer() {
    // Discard any partially typed digits for the current segment.
    this.segmentInputBuffer = '';
    this.segmentInputBufferSegment = null;
    this.segmentInputBufferUpdatedAt = 0;
  }

  updateSegmentInputBuffer(digit) {
    // Append digits typed in quick succession to the same segment; otherwise,
    // start a new segment edit.
    const now = Date.now();
    const shouldAppendToBuffer =
      this.segmentInputBufferSegment === this.activeSegment &&
      now - this.segmentInputBufferUpdatedAt < 1500 &&
      this.segmentInputBuffer.length < this.getSegmentLength(this.activeSegment);

    this.segmentInputBuffer = shouldAppendToBuffer
      ? `${this.segmentInputBuffer}${digit}`
      : digit;
    this.segmentInputBufferSegment = this.activeSegment;
    this.segmentInputBufferUpdatedAt = now;
  }

  handleDigitKey(digit) {
    // Numeric typing edits the selected segment rather than inserting freeform
    // text into the field.
    this.updateSegmentInputBuffer(digit);

    if (this.activeSegment === 'year') {
      // Year waits for all four digits before committing.
      if (this.segmentInputBuffer.length === 4) {
        this.commitSegmentValue('year', parseInt(this.segmentInputBuffer, 10));
        this.resetSegmentInputBuffer();
      }
      this.scheduleActiveSegmentSelection();
      return;
    }

    const numericValue = parseInt(this.segmentInputBuffer, 10);
    // Month/day allow a brief pause after digits that could still lead to a
    // valid two-digit value, such as 0_, 1_, 2_, or 3_.
    const isWaitingForSecondDigit =
      this.segmentInputBuffer === '0' ||
      (this.activeSegment === 'month' && numericValue <= 1) ||
      (this.activeSegment === 'day' && numericValue <= 3);

    if (this.segmentInputBuffer.length === 1 && isWaitingForSecondDigit) {
      this.scheduleActiveSegmentSelection();
      return;
    }

    this.commitSegmentValue(this.activeSegment, numericValue);
    this.resetSegmentInputBuffer();
    this.moveActiveSegment(1);
  }

  parseAcceptedDateInput(inputValue) {
    // Free typing and paste still accept a few common date formats and normalize
    // them back into the field's canonical display format.
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

  openCalendar() {
    // Open from the calendar button only; focusing the input should not pop the
    // calendar because it interferes with segmented keyboard editing.
    this.clearCloseCalendarTimeout();
    this.calendarOpen = true;
  }

  handleInput(event) {
    // Allow direct typing of full date strings as a fallback for users who paste
    // or overwrite the field value instead of using segment navigation.
    const parsedValue = this.parseAcceptedDateInput(event.target.value);
    if (parsedValue) {
      this.resetSegmentInputBuffer();
      this.commitSelectedDate(parsedValue);
    }
  }

  handleBlur() {
    // On blur, discard transient segment edits and snap the field back to the
    // last committed valid date.
    this.isInputFocused = false;
    this.resetSegmentInputBuffer();
    if (this.inputElement) {
      this.inputElement.value = this.getDisplayValue();
    }
  }

  handleFocus() {
    // Focusing the field selects the active segment instead of showing a caret.
    this.isInputFocused = true;
    this.scheduleActiveSegmentSelection();
  }

  handleMouseDown(event) {
    // Resolve the clicked segment from the caret position established by the
    // browser's default mousedown focus logic, then immediately reselect the
    // whole segment.
    this.isInputFocused = true;
    this.scheduleSegmentSelectionFromCaret(() => {
      return event.target.selectionStart || 0;
    });
  }

  handleKeyDown(event) {
    // The field owns keyboard semantics, so most editing/navigation keys are
    // intercepted and mapped to segment operations.
    if (!this.selectedDate) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      this.handleDigitKey(event.key);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.moveActiveSegment(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.moveActiveSegment(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.incrementActiveSegment(1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.incrementActiveSegment(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      this.setActiveSegment('month');
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.setActiveSegment('year');
      return;
    }

    if (event.key === 'Tab') {
      const currentIndex = this.segmentOrder.indexOf(this.activeSegment);
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex >= 0 && nextIndex < this.segmentOrder.length) {
        event.preventDefault();
        this.setActiveSegment(this.segmentOrder[nextIndex]);
      }
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.resetSegmentInputBuffer();
      this.scheduleActiveSegmentSelection();
    }
  }

  handlePaste(event) {
    // Normalized paste support keeps the custom field usable for power users.
    const pastedText = event.clipboardData.getData('text');
    const parsedValue = this.parseAcceptedDateInput(pastedText);
    if (!parsedValue) {
      return;
    }

    event.preventDefault();
    this.resetSegmentInputBuffer();
    this.commitSelectedDate(parsedValue);
    this.scheduleActiveSegmentSelection();
  }

  setSelectedDate(selectedDate) {
    // Calendar selections flow through the same commit path as keyboard edits.
    this.resetSegmentInputBuffer();
    this.commitSelectedDate(selectedDate);
    this.closeCalendarWithDelay();
  }

  view({ attrs }) {
    // The component exposes only an aria-label; styling and behavior are owned
    // internally so consumers cannot accidentally break the segmented UX.
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
          value={this.getDisplayValue()}
          onfocus={() => this.handleFocus()}
          onblur={() => this.handleBlur()}
          onmousedown={(event) => this.handleMouseDown(event)}
          onkeydown={(event) => this.handleKeyDown(event)}
          oninput={(event) => this.handleInput(event)}
          onpaste={(event) => this.handlePaste(event)}
          oncreate={({ dom }) => this.setInputElement(dom)}
          onupdate={({ dom }) => this.setInputElement(dom)}
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
