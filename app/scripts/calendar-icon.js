class CalendarIconComponent {

  view() {
    return m('svg[viewBox="0 0 32 32"]', [
      m('path', {
        d: 'M 10,10 L 10,22 L 22,22 L 22,10 Z M 10,12 L 22,12 M 12,10 L 12,8 M 20,10 L 20,8'
      })
    ]);
  }

}

export default CalendarIconComponent;
