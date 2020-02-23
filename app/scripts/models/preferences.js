import _ from 'lodash';

class Preferences {

  constructor() {
    this.load();
    this.eventCallbacks = {};
  }

  load() {
    Object.assign(this, Preferences.defaults, JSON.parse(localStorage.getItem('wtc-prefs')));
  }

  save() {
    localStorage.setItem('wtc-prefs', JSON.stringify(this));
  }

  set(key, value) {
    this[key] = value;
    this.trigger(`change:${key}`, key, value);
  }

  on(eventName, eventCallback) {
    if (!this.eventCallbacks[eventName]) {
      this.eventCallbacks[eventName] = [];
    }
    this.eventCallbacks[eventName].push(eventCallback);
  }

  trigger(eventName, ...eventArgs) {
    if (!this.eventCallbacks[eventName]) {
      this.eventCallbacks[eventName] = [];
    }
    this.eventCallbacks[eventName].forEach((eventCallback) => {
      eventCallback.apply(this, eventArgs);
    });
  }

  toJSON() {
    return _.pick(this, Object.keys(Preferences.defaults));
  }

}

Preferences.defaults = {
  // How often (in seconds) a reminder to update your log should be spawned; a
  // value of 0 indicates that no reminders are ever spawned
  reminderInterval: 0
};

export default Preferences;
