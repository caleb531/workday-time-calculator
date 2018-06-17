import _ from '../../../node_modules/lodash/index.js';
import moment from '../../../node_modules/moment/moment.js';

let timeFormat = 'h:mma';
// The number of minutes to round each time to
let timeIncrement = 15;

class Log {

  constructor(logContents) {
    let log = {};
    log.categories = this.getCategories(logContents);
    log.gaps = this.getGaps(log);
    log.overlaps = this.getOverlaps(log);
    this.calculateTotals(log);
    return log;
  }

  isTimeRange(logLine) {
    return !isNaN(parseInt(logLine, 10));
  }

  parseLineTimes(logLine) {
    let timeStrs = logLine.split(/\s*to\s*/);
    if (timeStrs.length === 1 || timeStrs[1] === '') {
      timeStrs[1] = timeStrs[0];
    }
    return timeStrs.map((timeStr) => {
      return this.makeTimeStrAbsolute(timeStr);
    });
  }

  makeTimeStrAbsolute(timeStr) {
    let hour = parseInt(timeStr, 10);
    if (hour > 11 || hour < 7) {
      return `${timeStr}pm`;
    } else {
      return `${timeStr}am`;
    }
  }

  getCategories(logContents) {

    let categories = [];
    let categoryMap = {};
    let currentCategory = null;

    logContents.ops.forEach((currentOp, o) => {
      let nextOp = logContents.ops[o + 1];
      if (nextOp && nextOp.attributes) {

        let currentLine = currentOp.insert;
        let indent = nextOp.attributes.indent || 0;

        if (indent === 0) {
          // Category
          // console.log('Category:', currentLine);
          let categoryName = currentLine.trim();
          if (categoryMap[categoryName]) {
            currentCategory = categoryMap[categoryName];
          } else {
            currentCategory = {
              name: currentLine,
              tasks: [],
              descriptions: []
            };
            categoryMap[categoryName] = currentCategory;
            categories.push(currentCategory);
          }
        } else if (indent === 1 && this.isTimeRange(currentLine) && currentCategory) {
          // Time range
          // console.log('Time:', currentLine);
          let timeStrs = this.parseLineTimes(currentLine);
          let startTime = moment(timeStrs[0], timeFormat);
          let endTime = moment(timeStrs[1], timeFormat);
          if (!startTime.isSame(endTime)) {
            currentCategory.tasks.push({
              startTime: startTime,
              endTime: endTime
            });
          }
        } else if (indent >= 1 && !this.isTimeRange(currentLine) && currentCategory && currentLine.trim() !== '') {
          // Task description
          // console.log('Desc:', currentLine);
          currentCategory.descriptions.push(currentLine);
        }

      }
    });

    return categories;

  }

  calculateTotals(log) {
    log.totalDuration = moment.duration(0);
    log.categories.forEach((category) => {
      category.totalDuration = moment.duration(0);
      category.tasks.forEach((task) => {
        task.totalDuration = moment.duration(
          task.endTime.diff(task.startTime));
        category.totalDuration.add(task.totalDuration);
      });
      log.totalDuration.add(category.totalDuration);
    });
    log.categories = _.sortBy(log.categories, (category) => category.totalDuration.asHours());
    _.reverse(log.categories);
  }

  getAllTasks(log) {
    let tasks = [];
    log.categories.forEach(function (category) {
      tasks.push(...category.tasks);
    });
    return tasks;
  }

  getAllTimeRanges(log) {
    let tasks = this.getAllTasks(log);
    let startTimes = tasks.map((task) => task.startTime);
    let endTimes = tasks.map((task) => task.endTime);
    return _.zip(startTimes, endTimes).map((rangeArray) => {
      return _.zipObject(['startTime', 'endTime'], rangeArray);
    });
  }

  sortTimeRanges(ranges) {
    return _.sortBy(ranges, (range) => [
      range.startTime,
      range.endTime
    ]);
  }

  getRangeMap(ranges) {
    let rangeMap = {};
    ranges.forEach((range) => {
      if (!rangeMap[range.startTime]) {
        rangeMap[range.startTime] = [];
      }
      rangeMap[range.startTime].push(range);
    });
    return rangeMap;
  }

  getGaps(log) {

    let gaps = [];

    let ranges = this.sortTimeRanges(this.getAllTimeRanges(log));
    let rangeMap = this.getRangeMap(ranges);

    if (ranges.length === 0) {
      return gaps;
    }

    let firstStartTime = _.first(ranges).startTime;
    let lastEndTime = _.last(ranges).endTime;
    let currentTime = firstStartTime.clone();
    let rangeSet = new Set();
    let gapStartTime = null;

    while (currentTime.isBefore(lastEndTime)) {
      if (rangeSet.has(currentTime.toString())) {
        rangeSet.delete(currentTime.toString());
      }
      if (rangeMap[currentTime]) {
        rangeMap[currentTime].forEach((range) => {
          rangeSet.add(range.endTime.toString());
        });
      }
      if (rangeSet.size === 0 && !gapStartTime) {
        gapStartTime = currentTime.clone();
      }
      if (gapStartTime && rangeSet.size > 0) {
        gaps.push({
          startTime: gapStartTime,
          endTime: currentTime.clone()
        });
        gapStartTime = null;
      }
      currentTime.add(timeIncrement, 'minutes');
    }

    return gaps;

  }

  getOverlaps(log) {

    let ranges = this.sortTimeRanges(this.getAllTimeRanges(log));

    let overlaps = [];
    ranges.forEach((rangeA, a) => {
      ranges.forEach((rangeB, b) => {
        // Skip over redundant comparisons
        if (b <= a) {
          return;
        }

        if (rangeA.startTime.isSameOrBefore(rangeB.startTime) && rangeB.startTime.isBefore(rangeB.endTime) && rangeB.endTime.isSameOrBefore(rangeA.endTime)) {
          // Case 1: SseE
          overlaps.push(rangeA, rangeB);
        } else if (rangeB.startTime.isSameOrBefore(rangeA.startTime) && rangeA.startTime.isBefore(rangeA.endTime) && rangeA.endTime.isSameOrBefore(rangeB.endTime)) {
          // Case 2: sSEe
          overlaps.push(rangeA, rangeB);
        } else if (rangeA.startTime.isSameOrBefore(rangeB.startTime) && rangeB.startTime.isBefore(rangeA.endTime) && rangeA.endTime.isSameOrBefore(rangeB.endTime)) {
          // Case 3: SsEe
          overlaps.push(rangeA, rangeB);
        } else if (rangeB.startTime.isSameOrBefore(rangeA.startTime) && rangeA.startTime.isBefore(rangeB.endTime) && rangeB.endTime.isSameOrBefore(rangeA.endTime)) {
          // Case 4: sSeE
          overlaps.push(rangeA, rangeB);
        }
      });
    });
    overlaps = _.uniqBy(overlaps, (overlap) => {
      return [overlap.startTime, overlap.endTime].join(',');
    });
    overlaps = this.sortTimeRanges(overlaps);

    return overlaps;

  }

}

export default Log;