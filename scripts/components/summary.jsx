import clsx from 'clsx';
import m from 'mithril';
import copySvgUrl from '../../icons/copy.svg';
import doneSvgUrl from '../../icons/done.svg';

class SummaryComponent {
  // Store a reference to the current log, and make sure it's always up-to-date
  oninit({ attrs: { preferences, log } }) {
    this.preferences = preferences;
    this.log = log;
    this.setTimeFormat();
    // Ensure that time calculations are re-run when time system changes (e.g.
    // beyween 12-hour and 24-hour)
    preferences.on('change:timeSystem', () => {
      this.log.regenerate();
    });
    preferences.on('change:categorySortOrder', () => {
      this.log.regenerate();
    });
  }
  onupdate({ attrs: { log } }) {
    this.log = log;
    this.setTimeFormat();
  }

  // Set the format of displayed times based on the user's preferred time system
  // (e.g. 12-hour or 24-hour)
  setTimeFormat() {
    if (this.preferences?.timeSystem === '24-hour') {
      this.timeFormat = 'H:mm';
    } else {
      this.timeFormat = 'h:mm';
    }
  }

  // Pad the given time value with zeroes if necessary
  padWithZeroes(time) {
    if (Number(time) < 10) {
      return '0' + time;
    } else {
      return time;
    }
  }

  getFormattedDuration(duration) {
    let isNegative = duration.asMinutes() < 0;
    let hours = Math.abs(duration.hours());
    let minutes = this.padWithZeroes(Math.abs(duration.minutes()));
    return `${isNegative ? '-' : ''}${hours}:${minutes}`;
  }

  async copyDescriptionToClipboard(copyButton) {
    const targetElement = document.querySelector(
      copyButton.getAttribute('data-clipboard-target')
    );
    await navigator.clipboard.writeText(targetElement.innerText);
    // Briefly indicate that the copy was successful
    const categoryIndex = copyButton.getAttribute('data-category-index');
    const category = this.log.categories[categoryIndex];
    category.copiedToClipboard = true;
    m.redraw();
    setTimeout(() => {
      category.copiedToClipboard = false;
      m.redraw();
    }, this.clipboardCopySuccessDelay);
  }

  getFormattedDescription(description) {
    return `- ${description}`;
  }

  view({ attrs: { log } }) {
    return log && log.categories.length > 0 ? (
      <div className="log-summary" data-testid="log-summary">
        <div className="log-summary-overview">
          <div className="log-summary-overview-main">
            <div className="log-total">
              <div className="log-total-time-name log-label">Total:</div>{' '}
              <div className="log-total-time log-value">
                {this.getFormattedDuration(log.totalDuration)}
              </div>
            </div>

            <div className="log-stats">
              {log.errors && log.errors.length > 0 ? (
                <div className="log-errors" data-testid="log-errors">
                  <span className="log-label">Errors:</span>{' '}
                  <div className="log-times log-error-times">
                    {log.errors.map((error) => {
                      return (
                        <div className="log-error">
                          <span className="log-error-start-time log-value">
                            {error.startTime.isValid()
                              ? error.startTime.format(this.timeFormat)
                              : '?'}
                          </span>{' '}
                          <span className="log-error-separator log-separator">
                            to
                          </span>{' '}
                          <span className="log-error-end-time log-value">
                            {error.endTime.isValid()
                              ? error.endTime.format(this.timeFormat)
                              : '?'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {log.gaps && log.gaps.length > 0 ? (
                <div className="log-gaps" data-testid="log-gaps">
                  <span className="log-label">Gaps:</span>{' '}
                  <div className="log-times log-gap-times">
                    {log.gaps.map((gap) => {
                      return (
                        <div className="log-gap">
                          <span className="log-gap-start-time log-value">
                            {gap.startTime.isValid()
                              ? gap.startTime.format(this.timeFormat)
                              : '?'}
                          </span>{' '}
                          <span className="log-gap-separator log-separator">
                            to
                          </span>{' '}
                          <span className="log-gap-end-time log-value">
                            {gap.endTime.isValid()
                              ? gap.endTime.format(this.timeFormat)
                              : '?'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {log.overlaps && log.overlaps.length > 0 ? (
                <div className="log-overlaps">
                  <span className="log-label">Overlaps:</span>{' '}
                  <div
                    className="log-times log-overlap-times"
                    data-testid="log-overlap-times"
                  >
                    {log.overlaps.map((overlap) => {
                      return (
                        <div className="log-overlap">
                          <span className="log-overlap-start-time log-value">
                            {overlap.startTime.isValid()
                              ? overlap.startTime.format(this.timeFormat)
                              : '?'}
                          </span>{' '}
                          <span className="log-overlap-separator log-separator">
                            to
                          </span>{' '}
                          <span className="log-overlap-end-time log-value">
                            {overlap.endTime.isValid()
                              ? overlap.endTime.format(this.timeFormat)
                              : '?'}
                          </span>{' '}
                          <span className="log-value-categories">
                            (
                            {overlap.categories
                              .map((category) => category.name)
                              .join(', ')}
                            )
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {log.latestRange ? (
            <div className="log-latest-time">
              <span className="log-label">Latest Time:</span>{' '}
              <span className="log-latest-time-time">
                <span className="log-value">
                  {log.latestRange.endTime.format(this.timeFormat)}
                </span>{' '}
                <span className="log-value-category">
                  ({log.latestRange.category.name})
                </span>
              </span>
            </div>
          ) : null}
        </div>

        <div className="log-summary-details">
          {log.categories.map((category, c) => {
            return (
              <div className="log-category">
                {category.totalDuration.asMinutes() > 0
                  ? [
                      <div className="log-category-header">
                        <span className="log-category-name log-label">
                          {category.name}:
                        </span>{' '}
                        <span className="log-category-total-time log-value">
                          {this.getFormattedDuration(category.totalDuration)}
                        </span>{' '}
                      </div>,

                      <div
                        className={clsx('log-category-descriptions-container', {
                          'copied-to-clipboard': category.copiedToClipboard
                        })}
                      >
                        {category.descriptions.length
                          ? [
                              <div
                                className="log-category-descriptions-copy-button"
                                data-clipboard-target={`#log-category-description-list-${c}`}
                                data-category-index={c}
                                onclick={(event) => {
                                  this.copyDescriptionToClipboard(
                                    event.currentTarget
                                  );
                                }}
                                title="Copy to Clipboard"
                              >
                                <img
                                  className="log-category-descriptions-copy-button-icon"
                                  src={
                                    category.copiedToClipboard
                                      ? doneSvgUrl
                                      : copySvgUrl
                                  }
                                  alt="Copy to Clipboard"
                                />
                              </div>,
                              <ul
                                className={`log-category-descriptions-list`}
                                id={`log-category-description-list-${c}`}
                              >
                                {category.descriptions.map((description) => {
                                  return (
                                    <li className="log-category-description">
                                      {this.getFormattedDescription(
                                        description
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            ]
                          : null}
                      </div>
                    ]
                  : null}
              </div>
            );
          })}
        </div>
      </div>
    ) : null;
  }
}
// The number of milliseconds to display a 'done' checkmark after a category's
// description block has been successfully copied to the clipboard
SummaryComponent.prototype.clipboardCopySuccessDelay = 1500;

export default SummaryComponent;
