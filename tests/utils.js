import { getByText, waitFor } from '@testing-library/dom';
import AppComponent from '../scripts/components/app.js';
import m from 'mithril';
import * as idbKeyval from 'idb-keyval';
import moment from 'moment';
import { defer, fromPairs } from 'lodash-es';

const testCases = import.meta.glob('./test-cases/*.json', {
  as: 'json',
  eager: true
});

// Expose a helper function that allows for any series of assertions to be run
// against each and every test case file
export function forEachTestCase(...args) {
  return Object.values(testCases).forEach(...args);
}

export async function renderApp() {
  document.body.appendChild(document.createElement('main'));
  m.mount(document.querySelector('main'), AppComponent);
}

export async function unmountApp() {
  m.mount(document.querySelector('main'), null);
}

// Apply to the application the given hashmap representing one or more entries
// of log contents; each key in this object is an integer representing the
// number of days difference from the current date (e.g. a value of '-1'
// represents yesterday, a value of '1' represents tomorrow, and a value of '0'
// represents today)
export async function applyLogContentsToApp(logContentsMapRelative) {
  return Promise.all(
    Object.entries(logContentsMapRelative).map(([key, logContents]) => {
      const daysFromToday = Number(key);
      const dateStr = moment().add(daysFromToday, 'day').format('l');
      const storageKey = `wtc-date-${dateStr}`;
      return idbKeyval.set(storageKey, logContents);
    })
  );
}

// Pad the given time string with zeroes if needed
export function padWithZeroes(time) {
  if (Number(time) < 10) {
    return '0' + time;
  } else {
    return time;
  }
}

// Format the given duration string in HH:MM format
export function formatDuration(durationStr) {
  let duration = moment.duration(durationStr, 'minutes');
  let isNegative = duration.asMinutes() < 0;
  let hours = Math.abs(duration.hours());
  let minutes = padWithZeroes(Math.abs(duration.minutes()));
  return `${isNegative ? '-' : ''}${hours}:${minutes}`;
}

// Format the given time string in H:MM format
export function formatTime(timeStr) {
  return moment(timeStr, 'h:mma').format('h:mm');
}
