import moment from 'moment';

class ReminderManager {

    constructor({preferences}) {
      this.preferences = preferences;
      if (Notification.permission === 'granted') {
        this.startTimer();
      } else if (Notification.permission === 'denied') {
        // TODO: handle this case
      }
      // Restart the reminder timer if the user has changed their preferred
      // interval in the Preferences UI (i.e. this listener will never run when
      // the preferences are initially loaded from disk)
      this.preferences.on('change:reminderInterval', () => {
        Notification.requestPermission().then(() => {
          this.restartTimer();
        });
      });
    }

    startTimer() {
      if (this.preferences.reminderInterval > 0 && Notification.permission === 'granted') {
        this.timer = setInterval(() => {
          this.spawnNotification();
        }, moment.duration(this.preferences.reminderInterval, 'minutes').asMilliseconds());
      }
    }

    restartTimer() {
      clearInterval(this.timer);
      this.startTimer();
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
