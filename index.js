/* global m, moment */
(function () {

let logTimeFormat = 'h:mma';

class AppComponent {

  constructor() {
    this.logText = localStorage.getItem('logText');
    if (this.logText) {
      this.log = this.parseTextLog(this.logText);
    }
  }

  getLineDepth(logLine) {
    return Math.round(logLine.search(/\S/) / 4);
  }

  getLineContent(logLine) {
    let matches = logLine.match(/^\s*\d+\. (.*?)$/);
    if (matches) {
      return matches[1];
    } else {
      return null;
    }
  }

  parseLineTimes(logLine) {
    return this.getLineContent(logLine)
      .split(/\s*to\s*/)
      .map((timeStr) => {
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

  getCategories(logText) {

    let logLines = logText.split('\n');
    let categories = [];
    let currentCategory = null;

    logLines.forEach((logLine) => {
      if (logLine.trim() !== '') {
        let lineDepth = this.getLineDepth(logLine);
        if (lineDepth === 0) {
          // This is a top-level category (e.g. Tyme, Internal, etc.)
          currentCategory = {
            name: this.getLineContent(logLine),
            timeRanges: []
          };
          categories.push(currentCategory);
        } else if (lineDepth === 1) {
          // This is a time range string
          let timeStrs = this.parseLineTimes(logLine);
          currentCategory.timeRanges.push({
            startTime: moment(timeStrs[0], logTimeFormat),
            endTime: moment(timeStrs[1], logTimeFormat)
          });
        }
      }
    });

    return categories;

  }

  calculateTotals(log) {
    log.totalDuration = moment.duration(0);
    log.categories.forEach((category) => {
      category.totalDuration = moment.duration(0);
      category.timeRanges.forEach((timeRange) => {
        timeRange.totalDuration = moment.duration(
          timeRange.endTime.diff(timeRange.startTime));
        category.totalDuration.add(timeRange.totalDuration);
      });
      log.totalDuration.add(category.totalDuration);
    });
  }

  // Pad the given time value with zeroes if necessary
  padWithZeroes(time) {
    if (Number(time) < 10) {
      return '0' + time;
    } else {
      return time;
    }
  }

  getFormattedDuration(duration) {
    let hours = duration.hours();
    let minutes = this.padWithZeroes(duration.minutes(), 2, '0');
    return `${hours}:${minutes}`;
  }

  parseTextLog(logText) {
    this.log = {};
    this.log.categories = this.getCategories(logText);
    this.calculateTotals(this.log);
    return this.log;
  }

  saveTextLog(logText) {
    localStorage.setItem('logText', logText);
  }

  view() {
    return m('div.app', [
      m('header.app-header', [
        m('h1', 'Workday Time Calculator')
      ]),
      m('div.app-content', [

        m('textarea.log-input', {
          // TODO: uncomment this
          // autofocus: true,
          placeholder: 'Paste your time log here',
          oninput: (event) => {
            this.logText = event.target.value;
            this.parseTextLog(event.target.value);
            this.saveTextLog(event.target.value);
          },
        }, this.logText),

        this.log ?
        m('div.log-calculations', [
          this.log.categories.map((category) => {
            return m('div.log-category', category.totalDuration.asMinutes() !== 0 ? [
              m('div.log-category-name.log-label', `${category.name}:`),
              ' ',
              m('div.log-category-total-time.log-value', [
                this.getFormattedDuration(category.totalDuration)
              ])
            ] : null);
          }),
          m('div.log-total', [
            m('div.log-total-time-name.log-label', 'Total'),
            m('div.log-total-time.log-value', this.getFormattedDuration(this.log.totalDuration))
          ])
        ]) : null

      ])
    ]);
  }

}

m.mount(document.body, AppComponent);

}());
