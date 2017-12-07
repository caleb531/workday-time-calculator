/* global _, m, moment */
(function () {

let logTimeFormat = 'h:mma';

class AppComponent {

  constructor() {
    this.logText = localStorage.getItem('logText');
    this.log = this.parseTextLog(this.logText);
  }

  getLineDepth(logLine) {
    return Math.round(logLine.search(/\S/) / 4);
  }

  getLineContent(logLine) {
    let matches = logLine.match(/^\s*\d+\.\s*(.*?)$/);
    if (matches) {
      return matches[1];
    } else {
      return '';
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
            tasks: [],
            descriptions: []
          };
          if (currentCategory.name !== null) {
            categories.push(currentCategory);
          }
        } else if (lineDepth === 1) {
          // This is a time range string
          let timeStrs = this.parseLineTimes(logLine);
          currentCategory.tasks.push({
            startTime: moment(timeStrs[0], logTimeFormat),
            endTime: moment(timeStrs[1], logTimeFormat)
          });
        } else if (lineDepth === 2) {
          // This is a description
          currentCategory.descriptions.push(this.getLineContent(logLine));
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

  getGaps(log) {
    let tasks = [];
    log.categories.forEach(function (category) {
      tasks.push(...category.tasks);
    });

    let startTimes = tasks.map((task) => task.startTime);
    let endTimes = tasks.map((task) => task.endTime);

    let times = startTimes.concat(endTimes);
    times = _.uniqBy(times, (time) => time.unix());
    times = _.sortBy(times, (time) => time.unix());

    let gapStartTimes = endTimes
      .filter((endTime) => {
        return !startTimes.some((startTime) => startTime.isSame(endTime));
      })
      .filter((endTime) => {
        return times.findIndex((time) => time.isSame(endTime)) < (times.length - 1);
      });

    let gapEndTimes = gapStartTimes.map((startTime) => {
      let nextIndex = times.findIndex((time) => time.isSame(startTime)) + 1;
      return times[nextIndex];
    });

    let gaps = _.zip(gapStartTimes, gapEndTimes).map(([startTime, endTime]) => {
      return {
        startTime: startTime,
        endTime: endTime
      };
    });
    return gaps;

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

  getFormattedDescription(description) {
    return `- ${description}`;
  }

  parseTextLog(logText) {
    if (typeof logText !== 'string') {
      logText = '';
    }
    this.log = {};
    this.log.categories = this.getCategories(logText);
    this.log.gaps = this.getGaps(this.log);
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
          autofocus: true,
          placeholder: 'Paste your time log here',
          oninput: (event) => {
            this.logText = event.target.value;
            this.parseTextLog(event.target.value);
            this.saveTextLog(event.target.value);
          },
        }, this.logText),

        this.log.categories.length > 0 ?
        m('div.log-calculations', [

          m('div.log-summary', [

            this.log.totalDuration.asMinutes() !== 0 ?
            m('div.log-total', [
              m('div.log-total-time-name.log-label', 'Total:'),
              ' ',
              m('div.log-total-time.log-value', this.getFormattedDuration(this.log.totalDuration))
            ]) : null,

            this.log.gaps.length !== 0 ?
            m('div.log-gaps', [
              m('span.log-label', 'Gaps:'),
              ' ',
              m('div.log-gap-times', this.log.gaps.map((gap) => {
                return m('div.log-gap', [
                  m('span.log-gap-start-time.log-value', gap.startTime.isValid() ? gap.startTime.format('h:mm') : '?'),
                  ' to ',
                  m('span.log-gap-end-time.log-value', gap.endTime.isValid() ? gap.endTime.format('h:mm') : '?')
                ]);
              }))
            ]) : null,

          ]),

          this.log.categories.map((category) => {
            return m('div.log-category', category.totalDuration.asMinutes() !== 0 ? [

              m('div.log-category-header', [

                  m('span.log-category-name.log-label', `${category.name}:`),
                  ' ',
                  m('span.log-category-total-time.log-value', [
                    this.getFormattedDuration(category.totalDuration)
                  ]),
                  ' ',
                  m('span.log-category-character-count', `(${_.sumBy(category.descriptions, (description) => this.getFormattedDescription(description).length) + (category.descriptions.length - 1)})`)

              ]),

              m('ul.log-category-descriptions', category.descriptions.map((description) => {
                return m('li.log-category-description', this.getFormattedDescription(description));
              }))

            ] : null);
          })

        ]) : null

      ])
    ]);
  }

}

m.mount(document.body, AppComponent);

}());
