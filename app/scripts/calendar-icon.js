class CalendarIconComponent {

  view({attrs}) {
    return m('svg[viewBox="0 0 32 32"]', [
      m('path', {
        d: 'M 9,9 L 9,23 L 23,23 L 23,9 Z M 9,11 L 23,11 M 11,9 L 11,7 M 21,9 L 21,7'
      }),
      m('text', {
        x: 16, y: 19.5,
        'text-anchor': 'middle'
      }, attrs.selectedDate.format('D'))
    ]);
  }

}

export default CalendarIconComponent;
