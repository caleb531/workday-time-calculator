let timeFormatShort = 'h:mm';

class SummaryComponent {

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

  getFormattedDescription(description) {
    return `- ${description}`;
  }

  view({attrs}) {

    return attrs.log && attrs.log.categories.length > 0 ? m('div.log-summary', [

      m('div.log-summary-overview', [

        m('div.log-total', [
          m('div.log-total-time-name.log-label', 'Total:'),
          ' ',
          m('div.log-total-time.log-value', this.getFormattedDuration(attrs.log.totalDuration))
        ]),

        m('.log-errors', [

          attrs.log.gaps.length > 0 ?
          m('div.log-gaps', [
            m('span.log-label', 'Gaps:'),
            ' ',
            m('div.log-times.log-gap-times', attrs.log.gaps.map((gap) => {
              return m('div.log-gap', [
                m('span.log-gap-start-time.log-value', gap.startTime.isValid() ? gap.startTime.format(timeFormatShort) : '?'),
                ' to ',
                m('span.log-gap-end-time.log-value', gap.endTime.isValid() ? gap.endTime.format(timeFormatShort) : '?')
              ]);
            }))
          ]) : null,

          attrs.log.overlaps.length > 0 ?
          m('div.log-overlaps', [
            m('span.log-label', 'Overlaps:'),
            ' ',
            m('div.log-times.log-overlap-times', attrs.log.overlaps.map((overlap) => {
              return m('div.log-overlap', [
                m('span.log-overlap-start-time.log-value', overlap.startTime.isValid() ? overlap.startTime.format(timeFormatShort) : '?'),
                ' to ',
                m('span.log-overlap-end-time.log-value', overlap.endTime.isValid() ? overlap.endTime.format(timeFormatShort) : '?'),
                ' ',
                m('span.log-overlap-category', `(${overlap.category.name})`)
              ]);
            }))
          ]) : null

        ])

      ]),

      m('div.log-summary-details', attrs.log.categories.map((category) => {
        return m('div.log-category', category.totalDuration.asMinutes() > 0 ? [

          m('div.log-category-header', [

              m('span.log-category-name.log-label', `${category.name}:`),
              ' ',
              m('span.log-category-total-time.log-value', [
                this.getFormattedDuration(category.totalDuration)
              ]),
              ' '

          ]),

          m('ul.log-category-descriptions', category.descriptions.map((description) => {
            return m('li.log-category-description', this.getFormattedDescription(description));
          }))

        ] : null);
      }))

    ]) : null;

  }

}

export default SummaryComponent;
