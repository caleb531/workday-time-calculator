import { findByRole, findByText } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import * as idbKeyval from 'idb-keyval';
import m from 'mithril';
import moment from 'moment';
import AppComponent from '../scripts/components/app.js';
import Preferences from '../scripts/models/preferences.js';

const originalLocationObject = window.location;

const testCases = import.meta.glob('./test-cases/*.json', {
  as: 'json',
  eager: true
});

// Expose a helper function that allows for any series of assertions to be run
// against each and every test case file
export function forEachTestCase(...args) {
  return Object.values(testCases).forEach(...args);
}

// Expose a helper function that allows for transformation of each and every
// test case file by mapping to a different value
export function mapTestCases(...args) {
  return Object.values(testCases).map(...args);
}

// Mount the application onto the page and render it
export async function renderApp() {
  const main = document.createElement('main');
  document.body.appendChild(main);
  m.mount(main, AppComponent);
}

// Reset the DOM and clear stores
export async function unmountApp() {
  const main = document.querySelector('main');
  m.mount(main, null);
  main.remove();
  idbKeyval.clear();
  localStorage.clear();
}

// A utility that can be used with the below applyLogContentsToApp() as an
// supported callback adapter for saving the respective log contents to
// localStorage
export async function saveToLocalStorage(storageKey, logContents) {
  return localStorage.setItem(storageKey, JSON.stringify(logContents));
}

// A utility that can be used with the below applyLogContentsToApp() as an
// supported callback adapter for saving the respective log contents to
// indexedDB
export async function saveToIndexedDB(storageKey, logContents) {
  return idbKeyval.set(storageKey, logContents);
}

// Build the storage key string for the given index; -1 represents yesterday, -1 represents yesterday, and 0 represents today
export function getStorageKeyFromDays(daysFromToday) {
  const dateStr = moment().add(daysFromToday, 'day').format('l');
  return `wtc-date-${dateStr}`;
}

// Apply to the application the given hashmap representing one or more entries
// of log contents; each key in this object is an integer representing the
// number of days difference from the current date (e.g. a value of '-1'
// represents yesterday, a value of '1' represents tomorrow, and a value of '0'
// represents today)
export async function applyLogContentsToApp(
  logContentsMapRelative,
  callback = saveToIndexedDB
) {
  return Promise.all(
    Object.entries(logContentsMapRelative).map(([key, logContents]) => {
      return callback(getStorageKeyFromDays(Number(key)), logContents);
    })
  );
}

// Set the given preferences for the current application; any unspecified
// preferences will fall back to the default values for those respective
// preferences
export function setPreferences(prefs, callback = saveToIndexedDB) {
  callback('wtc-prefs', {
    ...Preferences.getDefaultValueMap(),
    ...prefs
  });
}

export async function openPreferences() {
  const getToolsControl = () =>
    findByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
  const getPrefsMenuItem = () => findByText(document.body, 'Preferences');
  expect(await getToolsControl()).toBeInTheDocument();
  userEvent.click(await getToolsControl());
  expect(await getPrefsMenuItem()).toBeInTheDocument();
  userEvent.click(await getPrefsMenuItem());
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

// Mock the Location object so that we can mock its methods (which cannot be
// reassigned directly)
export function mockLocationObject() {
  // @ts-ignore (see <https://stackoverflow.com/a/61649798/560642>)
  delete window.location;
  window.location = {
    ...originalLocationObject,
    reload: vi.fn(),
    assign: vi.fn()
  };
}
