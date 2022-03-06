import _ from 'lodash';
import appStorage from './app-storage.js';

class Preferences {

  constructor() {
    this.eventCallbacks = {};
  }

  load() {
    return appStorage.get('wtc-prefs').then((prefs) => {
      Object.assign(this, Preferences.defaults, prefs);
      return this;
    });
  }

  save() {
    return appStorage.set('wtc-prefs', this.toJSON());
  }

  set(props, {trigger = true} = {}) {
    Object.keys(props).forEach((key) => {
      this[key] = props[key];
      if (trigger) {
        this.trigger(`change:${key}`, key, props[key]);
      }
    });
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
  reminderInterval: 0,
  // The time system used to parse out times that you enter
  timeSystem: '12-hour',
  // The sort order of category groupings
  categorySortOrder: 'duration',
  // The color theme used to give the app a personal touch
  colorTheme: 'blue'
};

export default Preferences;
