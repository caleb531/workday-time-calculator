import moment from 'moment';
import Log from '../scripts/models/log';
import Preferences from '../scripts/models/preferences';
import './custom-matchers.js';

const testCases = import.meta.glob('./test-cases/*.json', {
  as: 'json',
  eager: true
});

describe('Log model', () => {
  Object.values(testCases).forEach((testCase) => {
    it(testCase.description, async () => {
      const log = new Log(testCase.logContents, {
        calculateStats: true,
        preferences: new Preferences({
          categorySortOrder: null,
          ...testCase.preferences
        })
      });

      if (testCase.assertions.categories) {
        testCase.assertions.categories.forEach((expectedCategory, c) => {
          const category = log.categories[c];
          if (expectedCategory.name) {
            expect(category).toHaveProperty('name', expectedCategory.name);
          }
          if (expectedCategory.descriptions) {
            expect(category).toHaveProperty(
              'descriptions',
              expectedCategory.descriptions
            );
          }
          if (expectedCategory.tasks) {
            expectedCategory.tasks.forEach((expectedTask, t) => {
              const task = category.tasks[t];
              expect(task.startTime).toEqualTime(expectedTask.startTime);
              expect(task.endTime).toEqualTime(expectedTask.endTime);
              expect(task.totalDuration).toEqualDuration(
                expectedTask.totalDuration,
                'minutes'
              );
            });
            expect(category.tasks).toHaveLength(expectedCategory.tasks.length);
          }
          if (expectedCategory.totalDuration) {
            expect(category.totalDuration).toEqualDuration(
              expectedCategory.totalDuration,
              'minutes'
            );
          }
        });
        expect(log.categories).toHaveLength(
          testCase.assertions.categories.length
        );
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
          expect(log.overlaps[o].startTime).toEqualTime(
            expectedOverlap.startTime
          );
          expect(log.overlaps[o].endTime).toEqualTime(expectedOverlap.endTime);
        });
        expect(log.overlaps).toHaveLength(testCase.assertions.overlaps.length);
      }
    });
  });
});
