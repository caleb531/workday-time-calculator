import m from 'mithril';
import ClipboardJS from 'clipboard';

let timeFormatShort = 'h:mm';

class SummaryComponent {

  // Store a reference to the current log, and make sure it's always up-to-date
  oninit({attrs: {log}}) {
    this.log = log;
  }
  onupdate({attrs: {log}}) {
    this.log = log;
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

  bindCopyToClipboardEvent(vnode) {
    const clipboard = new ClipboardJS(vnode.dom);
    clipboard.on('success', (copyEvent) => {
      // In order for ClipboardJS to copy the text to the clipboard, it must
      // first select it; this text remains selected after the copy is complete,
      // so for a less-confusing UX, we clear the text selection after a
      // successful copy
      copyEvent.clearSelection();
      // Briefly indicate that the copy was successful
      const categoryIndex = vnode.dom.getAttribute('data-category-index');
      const category = this.log.categories[categoryIndex];
      category.copiedToClipboard = true;
      m.redraw();
      setTimeout(() => {
        category.copiedToClipboard = false;
        m.redraw();
      }, this.clipboardCopySuccessDelay);
    });
  }

  getFormattedDescription(description) {
    return `- ${description}`;
  }

  view({attrs: {log}}) {

    return log && log.categories.length > 0 ? m('div.log-summary', [

      m('div.log-summary-overview', [

        m('div.log-summary-overview-main', [

          m('div.log-total', [
            m('div.log-total-time-name.log-label', 'Total:'),
            ' ',
            m('div.log-total-time.log-value', this.getFormattedDuration(log.totalDuration))
          ]),

          m('.log-stats', [

            log.errors && log.errors.length > 0 ?
            m('div.log-errors', [
              m('span.log-label', 'Errors:'),
              ' ',
              m('div.log-times.log-error-times', log.errors.map((error) => {
                return m('div.log-error', [
                  m('span.log-error-start-time.log-value', error.startTime.isValid() ? error.startTime.format(timeFormatShort) : '?'),
                  ' ',
                  m('span.log-error-separator.log-separator', 'to'),
                  ' ',
                  m('span.log-error-end-time.log-value', error.endTime.isValid() ? error.endTime.format(timeFormatShort) : '?')
                ]);
              }))
            ]) : null,

            log.gaps && log.gaps.length > 0 ?
            m('div.log-gaps', [
              m('span.log-label', 'Gaps:'),
              ' ',
              m('div.log-times.log-gap-times', log.gaps.map((gap) => {
                return m('div.log-gap', [
                  m('span.log-gap-start-time.log-value', gap.startTime.isValid() ? gap.startTime.format(timeFormatShort) : '?'),
                  ' ',
                  m('span.log-gap-separator.log-separator', 'to'),
                  ' ',
                  m('span.log-gap-end-time.log-value', gap.endTime.isValid() ? gap.endTime.format(timeFormatShort) : '?')
                ]);
              }))
            ]) : null,

            log.overlaps && log.overlaps.length > 0 ?
            m('div.log-overlaps', [
              m('span.log-label', 'Overlaps:'),
              ' ',
              m('div.log-times.log-overlap-times', log.overlaps.map((overlap) => {
                return m('div.log-overlap', [
                  m('span.log-overlap-start-time.log-value', overlap.startTime.isValid() ? overlap.startTime.format(timeFormatShort) : '?'),
                  ' ',
                  m('span.log-overlap-separator.log-separator', 'to'),
                  ' ',
                  m('span.log-overlap-end-time.log-value', overlap.endTime.isValid() ? overlap.endTime.format(timeFormatShort) : '?'),
                  ' ',
                  m('span.log-value-categories', `(${overlap.categories.map((category) => category.name).join(', ')})`)
                ]);
              }))
            ]) : null

          ])

        ]),

        log.latestRange ?
        m('div.log-latest-time', [
          m('span.log-label', 'Latest Time:'),
          ' ',
          m('span.log-latest-time-time', [
            m('span.log-value', log.latestRange.endTime.format(timeFormatShort)),
            ' ',
            m('span.log-value-category', `(${log.latestRange.category.name})`)
          ])
        ]) : null

      ]),

      m('div.log-summary-details', log.categories.map((category, c) => {
        return m('div.log-category', category.totalDuration.asMinutes() > 0 ? [

          m('div.log-category-header', [

              m('span.log-category-name.log-label', `${category.name}:`),
              ' ',
              m('span.log-category-total-time.log-value', [
                this.getFormattedDuration(category.totalDuration)
              ]),
              ' '

          ]),

          m('div.log-category-descriptions-container', {
            class: category.copiedToClipboard ? 'copied-to-clipboard' : ''
          }, [
            m('div.log-category-descriptions-copy-button', {
              'data-clipboard-target': `#log-category-description-list-${c}`,
              'data-category-index': c,
              oncreate: (vnode) => this.bindCopyToClipboardEvent(vnode),
            }, [
              m('img.log-category-descriptions-copy-button-icon', {
                src: category.copiedToClipboard ? 'icons/done.svg' : 'icons/copy.svg',
                alt: 'Copy to Clipboard',
                title: 'Copy to Clipboard',
              })
            ]),
            m(`ul.log-category-descriptions-list#log-category-description-list-${c}`, category.descriptions.map((description) => {
              return m('li.log-category-description', this.getFormattedDescription(description));
            }))
          ])

        ] : null);
      }))

    ]) : null;

  }

}
// The number of milliseconds to display a 'done' checkmark after a category's
// description block has been successfully copied to the clipboard
SummaryComponent.prototype.clipboardCopySuccessDelay = 1500;

export default SummaryComponent;
