class CalendarIconComponent {
  view({ attrs: { selectedDate } }) {
    return (
      <svg viewBox="0 0 32 32">
        <path d="M 8,8 L 8,24 L 24,24 L 24,8 Z M 9,10 L 23,10 M 10,8 L 10,6 M 22,8 L 22,6" />
        <text x="16" y="20" text-anchor="middle">
          {selectedDate.format('D')}
        </text>
      </svg>
    );
  }
}

export default CalendarIconComponent;
