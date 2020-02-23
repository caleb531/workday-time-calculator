import moment from 'moment';

class ReminderManager {

    constructor({preferences}) {
      this.preferences = preferences;
      this.startTimer();
      // Restart the reminder timer if the user has changed their preferred
      // interval in the Preferences UI (i.e. this listener will never run when
      // the preferences are initially loaded from disk)
      this.preferences.on('change:reminderInterval', () => {
        Notification.requestPermission().then(() => {
          if (this.isReminderEnabled()) {
            this.spawnHelperNotification();
            this.restartTimer();
          }
        });
      });
    }

    isReminderEnabled() {
      return (this.preferences.reminderInterval > 0 && Notification.permission === 'granted');
    }

    startTimer() {
      if (this.isReminderEnabled()) {
        this.timer = setInterval(() => {
          this.spawnNotification();
        }, moment.duration(this.preferences.reminderInterval, 'minutes').asMilliseconds());
      }
    }

    restartTimer() {
      clearInterval(this.timer);
      this.startTimer();
    }

    spawnHelperNotification() {
      this.spawnNotification({
        body: `Reminder set to show every ${this.preferences.reminderInterval} minutes!`
      });
    }

    spawnReminder() {
      this.spawnNotification({
        body: 'Remember to update your log!',
      });
    }

    spawnNotification({body}) {
      /* eslint-disable-next-line no-new */
      new Notification('Workday Time Calculator', {
        body,
        icon: 'app-icon.png'
      });
    }

}

export default ReminderManager;
