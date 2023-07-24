import moment from 'moment';
import Log from '../scripts/models/log';
import { createLog } from './utils.js';
import './custom-matchers.js';

const logs = import.meta.glob('./test-logs/*.json', {
  as: 'json',
  eager: true
});
const testCases = import.meta.glob('./test-cases/*.json', {
  as: 'json',
  eager: true
});

describe('Log model', () => {

  Object.values(testCases).forEach((testCase) => {
    it(testCase.description, () => {
      const log = createLog(testCase.logContents);

      if (testCase.assertions.categories) {
        testCase.assertions.categories.forEach((expectedCategory, c) => {
          const category = log.categories[c];
          if (expectedCategory.name) {
            expect(category).toHaveProperty('name', expectedCategory.name);
          }
          if (expectedCategory.descriptions) {
            expect(category).toHaveProperty('descriptions', expectedCategory.descriptions);
          }
          if (expectedCategory.tasks) {
            expectedCategory.tasks.forEach((expectedTask, t) => {
              const task = category.tasks[t];
              expect(task.startTime).toEqualTime(expectedTask.startTime);
              expect(task.endTime).toEqualTime(expectedTask.endTime);
              expect(task.totalDuration).toEqualDuration(expectedTask.totalDuration, 'minutes');
            });
            expect(category.tasks).toHaveLength(expectedCategory.tasks.length);
          }
          if (expectedCategory.totalDuration) {
            expect(category.totalDuration).toEqualDuration(expectedCategory.totalDuration, 'minutes');
          }
        });
        expect(log.categories).toHaveLength(testCase.assertions.categories.length);
      }

      if (testCase.assertions.errors) {
        testCase.assertions.errors.forEach((expectedError, e) => {
          expect(log.errors[e].startTime).toEqualTime(expectedError.startTime);
          expect(log.errors[e].endTime).toEqualTime(expectedError.endTime);
        });
        expect(log.errors).toHaveLength(testCase.assertions.errors.length);
      }

      if (testCase.assertions.gaps) {
        testCase.assertions.gaps.forEach((expectedGap, g) => {
          expect(log.gaps[g].startTime).toEqualTime(expectedGap.startTime);
          expect(log.gaps[g].endTime).toEqualTime(expectedGap.endTime);
        });
        expect(log.gaps).toHaveLength(testCase.assertions.gaps.length);
      }

      if (testCase.assertions.overlaps) {
        testCase.assertions.overlaps.forEach((expectedOverlap, o) => {
          expect(log.overlaps[o].startTime).toEqualTime(expectedOverlap.startTime);
          expect(log.overlaps[o].endTime).toEqualTime(expectedOverlap.endTime);
        });
        expect(log.overlaps).toHaveLength(testCase.assertions.overlaps.length);
      }
    });
  });

  it('should detect single gaps', () => {
    const { gaps } = createLog(logs['./test-logs/gap-single.json']);
    expect(gaps[0].startTime).toEqualTime('9:30am');
    expect(gaps[0].endTime).toEqualTime('10:15am');
    expect(gaps).toHaveLength(1);
  });

  it('should detect multiple gaps', () => {
    const { gaps } = createLog(logs['./test-logs/gap-multiple.json']);
    expect(gaps[0].startTime).toEqualTime('9am');
    expect(gaps[0].endTime).toEqualTime('9:30am');
    expect(gaps[1].startTime).toEqualTime('10:15am');
    expect(gaps[1].endTime).toEqualTime('10:30am');
    expect(gaps[1].startTime).toEqualTime('10:15am');
    expect(gaps[1].endTime).toEqualTime('10:30am');
    expect(gaps[2].startTime).toEqualTime('11:45am');
    expect(gaps[2].endTime).toEqualTime('12:15pm');
    expect(gaps).toHaveLength(3);
  });

  it('should flag backward time range as an error', () => {
    const { errors } = createLog(logs['./test-logs/error-backwards.json']);
    expect(errors[0].startTime).toEqualTime('9am');
    expect(errors[0].endTime).toEqualTime('8:30am');
    expect(errors).toHaveLength(1);
  });

  it('should flag repeated time (within the same range) as an error', () => {
    const { errors } = createLog(logs['./test-logs/error-repeated-time.json']);
    expect(errors[0].startTime).toEqualTime('9am');
    expect(errors[0].endTime).toEqualTime('9am');
    expect(errors).toHaveLength(1);
  });

});
