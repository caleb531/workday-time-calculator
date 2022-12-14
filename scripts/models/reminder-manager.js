import moment from 'moment';

class ReminderManager {
  constructor({ preferences }) {
    this.preferences = preferences;
    this.startTimer();
    // Restart the reminder timer if the user has changed their preferred
    // interval in the Preferences UI (i.e. this listener will never run when
    // the preferences are initially loaded from disk)
    this.preferences.on('change:reminderInterval', () => {
      this.requestPermission();
    });
    if (
      this.preferences.reminderInterval > 0 &&
      Notification.permission === 'default'
    ) {
      this.requestPermission();
    }
  }

  requestPermission() {
    this.stopTimer();
    if (this.preferences.reminderInterval > 0) {
      Notification.requestPermission(() => {
        if (this.areRemindersEnabled()) {
          this.spawnHelperNotification();
          this.restartTimer();
        }
      });
    }
  }

  areRemindersEnabled() {
    return (
      this.preferences.reminderInterval > 0 &&
      Notification.permission === 'granted'
    );
  }

  startTimer() {
    if (this.areRemindersEnabled()) {
      this.queueCallbackOnNextInterval((callback) => {
        this.spawnReminder();
        this.queueCallbackOnNextInterval(callback);
      });
    }
  }

  queueCallbackOnNextInterval(callback) {
    this.timer = setTimeout(() => {
      callback(callback);
    }, this.getTimeOfNextReminder().diff(Date.now()));
  }

  // Calculate the time of the next reminder, which should be rounded to the
  // nearest multiple of the user's preferred interval (e.g. to the 15-minute,
  // or to the half-hour)
  getTimeOfNextReminder() {
    let time = moment();
    let nearestMinute =
      Math.ceil((time.minute() + 1) / this.preferences.reminderInterval) *
      this.preferences.reminderInterval;
    return time.clone().set({
      minute: nearestMinute,
      second: 0,
      millisecond: 0
    });
  }

  stopTimer() {
    clearTimeout(this.timer);
  }

  restartTimer() {
    this.stopTimer();
    this.startTimer();
  }

  spawnHelperNotification() {
    this.spawnNotification({
      body: `Reminder set to show every ${this.preferences.reminderInterval} minutes!`
    });
  }

  spawnReminder() {
    this.spawnNotification({
      body: 'Remember to update your log!'
    });
  }

  spawnNotification({ body }) {
    /* eslint-disable-next-line no-new */
    new Notification('Workday Time Calculator', {
      body,
      icon: 'app-icon.png'
    });
  }
}

export default ReminderManager;
