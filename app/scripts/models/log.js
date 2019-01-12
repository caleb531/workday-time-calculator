let timeFormat = 'h:mma';
// The number of minutes to round each time to
let minuteIncrement = 15;

class Log {

  constructor(logContents) {
    this.categories = this.getCategories(logContents);
    this.errors = this.getErrors();
    this.gaps = this.getGaps();
    this.overlaps = this.getOverlaps();
    this.latestRange = this.getlatestRange();
    this.calculateTotals();
  }

  splitLineIntoTimeStrs(logLine) {
    let timePatt = /(\d+(?:\s*\:+\s*\d*)?\s*(?:am?|pm?)?)/.source;
    let sepPatt = /[^a-z0-9]*\s*(t|o|to|ot|tp|\-)\s*[^a-z0-9]*/.source;
    let rangeRegex = new RegExp(`^${timePatt}${sepPatt}${timePatt}$`, 'i');
    let matches = logLine.match(rangeRegex);
    if (!matches) {
      return [];
    } else {
      return [matches[1], matches[3]];
    }
  }

  isTimeRange(logLine) {
    let timeStrs = this.splitLineIntoTimeStrs(logLine);
    let startTime = moment(timeStrs[0], timeFormat);
    let endTime = moment(timeStrs[1], timeFormat);
    return startTime.isValid() && endTime.isValid();
  }

  parseLineTimeStrs(logLine) {
    let timeStrs = this.splitLineIntoTimeStrs(logLine);
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

  roundTime(time) {
    let nearestMinute = Math.round(time.minute() / minuteIncrement) * minuteIncrement;
    return time.clone().minutes(nearestMinute);
  }

  getCategories(logContents) {

    let categories = [];
    let categoryMap = {};
    let currentCategory = null;
    let lastTimeRange = null;
    let lastTimeRangeIndent = null;

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
          } else if (categoryName !== '') {
            currentCategory = {
              name: categoryName,
              tasks: [],
              descriptions: []
            };
            categoryMap[categoryName] = currentCategory;
            lastTimeRange = null;
            categories.push(currentCategory);
          }
        } else if (indent >= 1 && this.isTimeRange(currentLine) && currentCategory) {
          // Time range
          // console.log('Time:', currentLine);
          let timeStrs = this.parseLineTimeStrs(currentLine);
          let startTime = this.roundTime(moment(timeStrs[0], timeFormat));
          let endTime = this.roundTime(moment(timeStrs[1], timeFormat));
          // If time range extends past midnight, count time range as overtime
          // for same day
          if (startTime.hour() >= 12 && endTime.hour() < 12) {
            endTime.add(24, 'hours');
          }
          let range = {
            startTime: startTime,
            endTime: endTime,
            category: currentCategory
          };
          currentCategory.tasks.push(range);
          lastTimeRange = range;
          lastTimeRangeIndent = indent;
        } else if (indent >= lastTimeRangeIndent && !this.isTimeRange(currentLine) && currentCategory && currentLine.trim() !== '' && lastTimeRange) {
          // Task description
          // console.log('Desc:', currentLine);
          currentCategory.descriptions.push(currentLine);
        }

      }
    });

    return categories;

  }

  calculateTotals() {
    this.totalDuration = moment.duration(0);
    this.categories.forEach((category) => {
      category.totalDuration = moment.duration(0);
      category.tasks.forEach((task) => {
        task.totalDuration = moment.duration(
          task.endTime.diff(task.startTime));
        category.totalDuration.add(task.totalDuration);
      });
      this.totalDuration.add(category.totalDuration);
    });
    this.categories = _.orderBy(this.categories, (category) => category.totalDuration.asHours(), 'desc');
  }

  getAllTasks() {
    let tasks = [];
    this.categories.forEach((category) => {
      tasks.push(...category.tasks);
    });
    return tasks;
  }

  getAllTimeRanges() {
    let tasks = this.getAllTasks();
    return tasks.map((task) => {
      return {
        startTime: task.startTime,
        endTime: task.endTime,
        category: task.category
      };
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

  getErrors() {

    let errors = [];
    let ranges = this.sortTimeRanges(this.getAllTimeRanges());

    ranges.forEach((range) => {
      if (range.startTime.isSameOrAfter(range.endTime)) {
        errors.push(range);
      }
    });

    return errors;

  }

  getGaps() {

    let gaps = [];
    let ranges = this.sortTimeRanges(this.getAllTimeRanges());
    let rangeMap = this.getRangeMap(ranges);

    if (ranges.length === 0) {
      return gaps;
    }

    let firstStartTime = _.first(ranges).startTime;
    let lastEndTime = _.last(ranges).endTime;
    let currentTime = firstStartTime.clone();
    let endTimeSet = new Set();
    let gapStartTime = null;

    while (currentTime.isBefore(lastEndTime)) {
      if (endTimeSet.has(currentTime.toString())) {
        endTimeSet.delete(currentTime.toString());
      }
      if (rangeMap[currentTime]) {
        rangeMap[currentTime].forEach((range) => {
          endTimeSet.add(range.endTime.toString());
        });
      }
      if (endTimeSet.size === 0 && !gapStartTime) {
        gapStartTime = currentTime.clone();
      }
      if (gapStartTime && endTimeSet.size > 0) {
        gaps.push({
          startTime: gapStartTime,
          endTime: currentTime.clone()
        });
        gapStartTime = null;
      }
      currentTime.add(minuteIncrement, 'minutes');
    }

    return gaps;

  }

  getOverlaps() {

    let ranges = this.sortTimeRanges(this.getAllTimeRanges());

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
      return [overlap.startTime, overlap.endTime, overlap.category.name].join(',');
    });
    overlaps = this.sortTimeRanges(overlaps);

    return overlaps;

  }

  getlatestRange() {
    return _.maxBy(this.getAllTimeRanges(), (range) => range.endTime);
  }

}

export default Log;
