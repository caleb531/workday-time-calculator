import '../styles/index.scss';
import m from '../../node_modules/mithril/mithril.min.js';
import _ from '../../node_modules/lodash/index.js';
import moment from '../../node_modules/moment/min/moment.min.js';
import Quill from '../../node_modules/quill/dist/quill.min.js';

let logTimeFormat = 'h:mma';
let logGapFormat = 'h:mm';
// The format of the date used for indexing each log
let logDateIdFormat = 'l';
// The number of minutes to round each time to
let logTimeIncrement = 15;

class AppComponent {

  constructor() {
    this.selectedDate = this.getSelectedDate();
    this.parseSelectedDateLog();
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
          let startTime = moment(timeStrs[0], logTimeFormat);
          let endTime = moment(timeStrs[1], logTimeFormat);
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

  getRangeStr(range) {
    return `${range.startTime.format(logGapFormat)}-${range.endTime.format(logGapFormat)}`;
  }

  logRangeSet(label, rangeSet) {
    console.log(`${label} { ${Array.from(rangeSet).map((endTimeKey) => {
      return moment(endTimeKey).format(logGapFormat);
    }).join(', ')} }`);
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
      // console.log(currentTime.format(logGapFormat));
      // this.logRangeSet('initial', rangeSet);
      if (rangeSet.has(currentTime.toString())) {
        rangeSet.delete(currentTime.toString());
        // this.logRangeSet('pop', rangeSet);
      }
      if (rangeMap[currentTime]) {
        rangeMap[currentTime].forEach((range) => {
          rangeSet.add(range.endTime.toString());
          // this.logRangeSet('push', rangeSet);
        });
      }
      if (rangeSet.size === 0 && !gapStartTime) {
        // console.log('gap start', currentTime.format(logGapFormat));
        gapStartTime = moment(currentTime);
      }
      if (gapStartTime && rangeSet.size !== 0) {
        // console.log('gap end', currentTime.format(logGapFormat));
        // console.log('GAP', this.getRangeStr({
        //   startTime: gapStartTime,
        //   endTime: moment(currentTime)
        // }));
        gaps.push({
          startTime: gapStartTime,
          endTime: moment(currentTime)
        });
        gapStartTime = null;
      }
      currentTime.add(logTimeIncrement, 'minutes');
      // console.log('');
    }

    return gaps;

  }

  computeIndexHash(a, b) {
    return (Math.pow(a + 1, 2) * Math.pow(b + 1, 2)) + a + b;
  }

  getOverlaps(log) {

    let ranges = this.sortTimeRanges(this.getAllTimeRanges(log));

    let overlaps = [];
    let encounteredRanges = new Set();
    ranges.forEach((rangeA, a) => {
      ranges.forEach((rangeB, b) => {
        // Skip if range A is crossed with itself, or if we've encountered this
        // same pair of ranges already
        if (a === b || encounteredRanges.has(this.computeIndexHash(a, b))) {
          return;
        }
        encounteredRanges.add(this.computeIndexHash(a, b));

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

  parseTextLog() {
    if (typeof this.logContents !== 'object') {
      this.logContents = this.getDefaultLogContents();
    }
    this.log = {};
    this.log.categories = this.getCategories(this.logContents);
    this.log.gaps = this.getGaps(this.log);
    this.log.overlaps = this.getOverlaps(this.log);
    this.calculateTotals(this.log);
  }

  saveTextLog() {
    localStorage.setItem(this.getSelectedDateStorageId(), JSON.stringify(this.editor.getContents()));
  }

  getSelectedDateId() {
    return this.selectedDate.format(logDateIdFormat);
  }

  getSelectedDateStorageId() {
    return `wtc-date-${this.getSelectedDateId()}`;
  }

  getSelectedDate() {
    let selectedDateStr = localStorage.getItem('selectedDate');
    if (selectedDateStr) {
      return moment(selectedDateStr);
    } else {
      return moment();
    }
  }

  loadSelectedDateLog() {
    let dateStorageId = this.getSelectedDateStorageId();
    let logContentsStr = localStorage.getItem(dateStorageId);
    try {
      this.logContents = JSON.parse(logContentsStr) || this.getDefaultLogContents();
    } catch (error) {
      this.logContents = this.getDefaultLogContents();
    }
  }

  getDefaultLogContents() {
    return {
      ops: [{
        insert: '\n'
      }]
    };
  }

  parseSelectedDateLog() {
    this.loadSelectedDateLog();
    this.parseTextLog();
  }

  selectPrevDay() {
    this.selectedDate.subtract(1, 'day');
    this.parseSelectedDateLog();
    this.setEditorText();
  }

  selectNextDay() {
    this.selectedDate.add(1, 'day');
    this.parseSelectedDateLog();
    this.setEditorText();
  }

  setEditorText() {
    this.editor.setContents(this.logContents);
  }

  initializeEditor(editorContainer) {
    this.editor = new Quill(editorContainer, {
      theme: 'snow',
      placeholder: '1. Red\n\ta. 9 to 12:15\n\t\ti. Did this\n2. Tyme\n\ta. 12:45 to 5\n\t\ti. Did that',
      formats: ['list', 'indent'],
      modules: {
        toolbar: [
          [{'list': 'bullet'}, {'list': 'ordered'}],
          [{'indent': '-1'}, {'indent': '+1'}],
        ],
        keyboard: {
          bindings: {
            // Use <tab> and shift-<tab> to indent/un-indent; these must be
            // defined on editor initialization rather than via
            // keyboard.addBinding (see
            // <https://github.com/quilljs/quill/issues/1647>)
            tab: {
              key: 9,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '+1'}, 'user');
              }
            },
            shiftTab: {
              key: 9,
              shiftKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '-1'}, 'user');
              }
            },
            indent: {
              // 221 corresponds to right bracket (']')
              key: 221,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '+1'}, 'user');
              }
            },
            unIndent: {
              // 219 corresponds to left bracket ('[')
              key: 219,
              shortKey: true,
              handler: (range) => {
                this.editor.formatLine(range, {'indent': '-1'}, 'user');
              }
            }
          }
        }
      },
    });
    this.editor.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        this.logContents = this.editor.getContents();
        this.parseTextLog();
        this.saveTextLog();
        m.redraw();
      }
      this.editor.focus();
    });
    this.setEditorText();
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

          m('div.log-editor', {
            oncreate: (vnode) => {
              this.initializeEditor(vnode.dom);
            },
          }),

          m('div.log-date-area', [

            m('div.log-date-controls', [
              m('span.log-date-control.log-prev-day-control', {
                onclick: () => {
                  this.selectPrevDay();
                  this.saveTextLog();
                }
              }, m('svg[viewBox="0 0 32 32"]', m('polyline', {
                points: '18,10 10,16 18,22'
              }))),
              m('span.log-date-control.log-next-day-control', {
                onclick: () => {
                  this.selectNextDay();
                  this.saveTextLog();
                }
              }, m('svg[viewBox="0 0 32 32"]', m('polyline', {
                points: '12,10 20,16 12,22'
              })))
            ]),
            m('div.log-selected-date', [
              m('div.log-selected-date-absolute', this.selectedDate.format('dddd, MMM DD, YYYY')),
              m('div.log-selected-date-relative', this.selectedDate.isSame(moment(), 'day') ? 'today' : `${this.selectedDate.fromNow()}`),
            ])
          ])

        ]),

        this.log.categories.length > 0 ?
        m('div.log-calculations', [

          m('div.log-summary', [

            this.log.totalDuration.asMinutes() !== 0 ?
            m('div.log-total', [
              m('div.log-total-time-name.log-label', 'Total:'),
              ' ',
              m('div.log-total-time.log-value', this.getFormattedDuration(this.log.totalDuration))
            ]) : null,

            m('.log-stats', [

              this.log.gaps.length !== 0 ?
              m('div.log-gaps', [
                m('span.log-label', 'Gaps:'),
                ' ',
                m('div.log-times.log-gap-times', this.log.gaps.map((gap) => {
                  return m('div.log-gap', [
                    m('span.log-gap-start-time.log-value', gap.startTime.isValid() ? gap.startTime.format(logGapFormat) : '?'),
                    ' to ',
                    m('span.log-gap-end-time.log-value', gap.endTime.isValid() ? gap.endTime.format(logGapFormat) : '?')
                  ]);
                }))
              ]) : null,

              this.log.overlaps.length !== 0 ?
              m('div.log-overlaps', [
                m('span.log-label', 'Overlaps:'),
                ' ',
                m('div.log-times.log-overlap-times', this.log.overlaps.map((overlap) => {
                  return m('div.log-overlap', [
                    m('span.log-overlap-start-time.log-value', overlap.startTime.isValid() ? overlap.startTime.format(logGapFormat) : '?'),
                    ' to ',
                    m('span.log-overlap-end-time.log-value', overlap.endTime.isValid() ? overlap.endTime.format(logGapFormat) : '?')
                  ]);
                }))
              ]) : null

            ])

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
                  m('span.log-category-character-count', `(${_.sumBy(category.descriptions, (description) => this.getFormattedDescription(description).length) + category.descriptions.length})`)

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
