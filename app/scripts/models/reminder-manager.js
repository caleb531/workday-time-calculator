import moment from 'moment';

class ReminderManager {

    constructor() {
      if (Notification.permission === 'granted') {
        this.startTimer();
      } else if (Notification.permission === 'denied') {
        // TODO: handle this case
      }
    }

    startTimer() {
      setInterval(() => {
        this.spawnNotification();
      }, moment.duration(30, 'minutes').asMilliseconds());
    }

    spawnNotification() {
      /* eslint-disable-next-line no-new */
      new Notification('Workday Time Calculator', {
        body: 'Remember to update your log!',
        icon: 'app-icon.png'
      });
    }

}

export default ReminderManager;
