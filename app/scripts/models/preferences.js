import _ from 'lodash';
import appStorage from './app-storage.js';

class Preferences {

  constructor() {
    this.eventCallbacks = {};
  }

  load() {
    return appStorage.get('wtc-prefs').then((prefs) => {
      Object.assign(this, this.getDefaultValueMap(), prefs);
      this.validatePreferenceValues();
      return this;
    });
  }

  // Get a map of default values, where the key is the preference ID and the
  // value is the default value for that preference
  getDefaultValueMap() {
    return _.fromPairs(Preferences.preferences.map((preference) => {
      return [preference.id, preference.defaultValue];
    }));
  }

  // Validate each of the user's saved preferences; if a value is not a valid
  // value, set it to the default value for that preference
  validatePreferenceValues() {
    let shouldResavePreferences = false;
    Preferences.preferences.forEach((preference) => {
      const validValues = preference.options.map((option) => option.value);
      if (this[preference.id] && !validValues.includes(this[preference.id])) {
        this[preference.id] = preference.defaultValue;
        shouldResavePreferences = true;
      }
    });
    // If at least one of the user's preferences has an invalid value, we
    // should not only correct it, but we should write back to the app storage
    // to ensure that corrected value persists
    if (shouldResavePreferences) {
      this.save();
    }
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
    return _.pick(this, Preferences.preferences.map((preference) => preference.id));
  }

}

Preferences.preferences = [
  // The color theme used to give the app a personal touch
  {
    id: 'colorTheme',
    label: 'Color Theme',
    description: 'What color would you like as your WTC app\'s theme?',
    optionType: 'color',
    defaultValue: 'blue',
    options: [
      {label: 'Blue', value: 'blue'},
      {label: 'Green', value: 'green'},
      {label: 'Purple', value: 'purple'},
      {label: 'Rose', value: 'rose'},
      {label: 'Slate', value: 'slate'},
    ]
  },
  // How often (in seconds) a reminder to update your log should be spawned; a
  // value of 0 indicates that no reminders are ever spawned
  {
    id: 'reminderInterval',
    label: 'Reminder Interval',
    description: 'How often should WTC remind you to update your time log?',
    defaultValue: 0,
    options: [
      {label: 'Never', value: 0},
      {label: 'Every 15 minutes', value: 15},
      {label: 'Every half-hour', value: 30},
      {label: 'Every hour', value: 60}
    ]
  },
  // Whether or not the word autocomplete functionality is enabled (although
  // this may option may be expanded in the future with additional autocomplete
  // behaviors, hence the name "Autocomplete Mode")
  {
    id: 'autocompleteMode',
    label: 'Autocomplete Suggestions',
    description: 'Would you like WTC to suggest words as you type in the editor? These suggestions are based on your log history, and no information ever leaves your local device.',
    defaultValue: 'lazy',
    options: [
      {label: 'Disabled', value: 'off'},
      {label: 'Lazy Mode (autocompletes one word at a time)', value: 'lazy'},
      {label: 'Greedy Mode (autocompletes longer phrases)', value: 'greedy'}
    ]
  },
  // The time system used to parse out times that you enter
  {
    id: 'timeSystem',
    label: 'Time System',
    description: 'Which time system do you prefer when entering and displaying times?',
    defaultValue: '12-hour',
    options: [
      {label: '12-hour', value: '12-hour'},
      {label: '24-hour / military time', value: '24-hour'}
    ]
  },
  // The sort order of category groupings
  {
    id: 'categorySortOrder',
    label: 'Category Sort Order',
    description: 'How should category groupings be sorted in the Summary view?',
    defaultValue: 'duration',
    options: [
      {label: 'No sorting', value: 'none'},
      {label: 'Title (ascending)', value: 'title'},
      {label: 'Duration (descending)', value: 'duration'}
    ]
  }
];

export default Preferences;
