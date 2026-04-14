import * as idbKeyval from 'idb-keyval';
import { orderBy } from 'lodash-es';
import moment from 'moment';
import Log from './log.js';

function getEntryDate(storageKey) {
  return moment(storageKey.replace(/^wtc-date-/, ''), 'l', true);
}

function isLogEntry([storageKey, logContents]) {
  return /^wtc-date-/.test(storageKey) && logContents?.ops;
}

function isDateInRange(date, startDate, endDate) {
  return (
    date.isSameOrAfter(startDate, 'day') &&
    date.isSameOrBefore(endDate, 'day')
  );
}

function sortCategories(categories, categorySortOrder) {
  if (categorySortOrder === 'duration') {
    return orderBy(categories, ['totalMinutes', 'name'], ['desc', 'asc']);
  } else if (categorySortOrder === 'title') {
    return orderBy(categories, ['name'], ['asc']);
  }
  return orderBy(categories, ['firstSeenIndex'], ['asc']);
}

export async function collectAnalytics({ startDate, endDate, preferences }) {
  const startMoment = moment(startDate, 'YYYY-MM-DD', true);
  const endMoment = moment(endDate, 'YYYY-MM-DD', true);

  if (!startMoment.isValid() || !endMoment.isValid()) {
    return [];
  }

  const entries = await idbKeyval.entries();
  const categoryMap = {};
  let firstSeenIndex = 0;

  entries.filter(isLogEntry).forEach(([storageKey, logContents]) => {
    const entryDate = getEntryDate(storageKey);
    if (
      !entryDate.isValid() ||
      !isDateInRange(entryDate, startMoment, endMoment)
    ) {
      return;
    }

    const log = new Log(logContents, {
      preferences: preferences,
      calculateStats: false
    });

    log.categories.forEach((category) => {
      const totalMinutes = category.totalDuration.asMinutes();
      if (!categoryMap[category.name]) {
        categoryMap[category.name] = {
          name: category.name,
          totalMinutes: 0,
          firstSeenIndex: firstSeenIndex
        };
        firstSeenIndex += 1;
      }
      categoryMap[category.name].totalMinutes += totalMinutes;
    });
  });

  return sortCategories(
    Object.values(categoryMap).filter((category) => category.totalMinutes > 0),
    preferences.categorySortOrder
  );
}