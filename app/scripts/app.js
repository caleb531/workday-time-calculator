import _ from '../../node_modules/lodash/index.js';
import m from '../../node_modules/mithril/mithril.min.js';
import moment from '../../node_modules/moment/min/moment.min.js';

import EditorComponent from './editor.js';
import DateComponent from './date.js';
import SummaryComponent from './summary.js';

let timeFormat = 'h:mma';
// The number of minutes to round each time to
let timeIncrement = 15;

class AppComponent {

  parseTextLog(logContents) {
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

    let ranges = this.sortTimeRanges(this.getAllTimeRanges(log));

    let rangeMap = this.getRangeMap(ranges);

    if (ranges.length === 0) {
      return;
    }

    let firstStartTime = _.first(ranges).startTime;
    let lastEndTime = _.last(ranges).endTime;
    let currentTime = moment(firstStartTime);
    let rangeSet = new Set();
    let gapStartTime = null;
    let gaps = [];

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
        gapStartTime = moment(currentTime);
      }
      if (gapStartTime && rangeSet.size !== 0) {
        gaps.push({
          startTime: gapStartTime,
          endTime: moment(currentTime)
        });
        gapStartTime = null;
      }
      currentTime.add(timeIncrement, 'minutes');
      // console.log('');
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
          overlaps.push(rangeA);
          overlaps.push(rangeB);
        } else if (rangeB.startTime.isSameOrBefore(rangeA.startTime) && rangeA.startTime.isBefore(rangeA.endTime) && rangeA.endTime.isSameOrBefore(rangeB.endTime)) {
          // Case 2: sSEe
          overlaps.push(rangeA);
          overlaps.push(rangeB);
        } else if (rangeA.startTime.isSameOrBefore(rangeB.startTime) && rangeB.startTime.isBefore(rangeA.endTime) && rangeA.endTime.isSameOrBefore(rangeB.endTime)) {
          // Case 3: SsEe
          overlaps.push(rangeA);
          overlaps.push(rangeB);
        } else if (rangeB.startTime.isSameOrBefore(rangeA.startTime) && rangeA.startTime.isBefore(rangeB.endTime) && rangeB.endTime.isSameOrBefore(rangeA.endTime)) {
          // Case 4: sSeE
          overlaps.push(rangeA);
          overlaps.push(rangeB);
        }
      });
    });
    overlaps = _.uniq(overlaps);
    overlaps = this.sortTimeRanges(overlaps);

    return overlaps;

  }

  view() {
    return m('div.app', [
      m('header.app-header', [
        m('h1', 'Workday Time Calculator'),
        m('span#personal-site-link.nav-link.nav-link-right', [
          'by ', m('a[href=https://calebevans.me/]', 'Caleb Evans')
        ])
      ]),
      m('div.app-content', [

        m('div.log-area', [

          m(EditorComponent, {
            selectedDate: this.selectedDate,
            onSetContents: (logContents) => {
              this.logContents = logContents;
              m.redraw();
            }
          }),

          m(DateComponent, {
            onSetSelectedDate: (selectedDate) => {
              this.selectedDate = selectedDate;
              m.redraw();
            }
          })

        ]),

        this.logContents ? m(SummaryComponent, {
          log: this.parseTextLog(this.logContents)
        }) : null

      ])

    ]);

  }

}

export default AppComponent;
