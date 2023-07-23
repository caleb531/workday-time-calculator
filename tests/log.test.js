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
      testCase.assertions.categories.forEach((expectedCategory, c) => {
        const category = log.categories[c];
        expect(category).toHaveProperty('name', expectedCategory.name);
        expect(category).toHaveProperty('descriptions', expectedCategory.descriptions);
        expectedCategory.tasks.forEach((expectedTask, t) => {
          const task = category.tasks[t];
          expect(task.startTime).toEqualTime(expectedTask.startTime);
          expect(task.endTime).toEqualTime(expectedTask.endTime);
          expect(task.totalDuration).toEqualDuration(expectedTask.totalDuration, 'minutes');
        });
        expect(category.tasks).toHaveLength(expectedCategory.tasks.length);
        expect(category.totalDuration).toEqualDuration(expectedCategory.totalDuration, 'minutes');
      });
    });
  });

  it('should instantiate real-world log with multiple categories, descriptions, and a gap', () => {
    const log = createLog(logs['./test-logs/real-world-1.json']);
    const { categories } = log;

    // Internal

    expect(categories[0]).toHaveProperty('name', 'Internal');
    expect(categories[0]).toHaveProperty('descriptions', [
      'Responding to comments',
      'Weekly dev team scrum'
    ]);

    expect(categories[0].tasks[0].startTime).toEqualTime('9am');
    expect(categories[0].tasks[0].endTime).toEqualTime('9:15am');
    expect(categories[0].tasks[0].totalDuration).toEqualDuration(15, 'minutes');

    expect(categories[0].tasks[1].startTime).toEqualTime('10am');
    expect(categories[0].tasks[1].endTime).toEqualTime('11am');
    expect(categories[0].tasks[1].totalDuration).toEqualDuration(60, 'minutes');

    expect(categories[0].totalDuration).toEqualDuration(75, 'minutes');

    // Client A

    expect(categories[1]).toHaveProperty('name', 'Client A');
    expect(categories[1]).toHaveProperty('descriptions', [
      'Meeting with client PM',
      'Emailing client about X'
    ]);

    expect(categories[1].tasks[0].startTime).toEqualTime('9:15am');
    expect(categories[1].tasks[0].endTime).toEqualTime('10am');
    expect(categories[1].tasks[0].totalDuration).toEqualDuration(45, 'minutes');

    expect(categories[1].tasks[1].startTime).toEqualTime('11am');
    expect(categories[1].tasks[1].endTime).toEqualTime('12pm');
    expect(categories[1].tasks[1].totalDuration).toEqualDuration(60, 'minutes');

    expect(categories[1].tasks[2].startTime).toEqualTime('12:30pm');
    expect(categories[1].tasks[2].endTime).toEqualTime('1pm');
    expect(categories[1].tasks[2].totalDuration).toEqualDuration(30, 'minutes');

    expect(categories[1].tasks[3].startTime).toEqualTime('1pm');
    expect(categories[1].tasks[3].endTime).toEqualTime('1:15pm');
    expect(categories[1].tasks[3].totalDuration).toEqualDuration(15, 'minutes');

    expect(categories[1].totalDuration).toEqualDuration(150, 'minutes');

    // Client B

    expect(categories[2]).toHaveProperty('name', 'Client B');
    expect(categories[2]).toHaveProperty('descriptions', [
      'Implementing new feature for client website'
    ]);
    expect(categories[2].tasks[0].startTime).toEqualTime('1:15pm');
    expect(categories[2].tasks[0].endTime).toEqualTime('2:30pm');
    expect(categories[2].tasks[0].totalDuration).toEqualDuration(75, 'minutes');

    // Totals

    expect(log.totalDuration).toEqualDuration(300, 'minutes');
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(1);
    expect(log.gaps[0].startTime).toEqualTime('12pm');
    expect(log.gaps[0].endTime).toEqualTime('12:30pm');
    expect(log.overlaps).toHaveLength(0);
  });

  it('should instantiate real-world log with midnight crossover', () => {
    const log = createLog(logs['./test-logs/real-world-2.json']);
    const { categories } = log;

    // Internal

    expect(categories[0]).toHaveProperty('name', 'Internal');
    expect(categories[0]).toHaveProperty('descriptions', [
      'Getting started with my day',
      'Intro meeting',
      'Updating calendar events',
      'Changing passwords',
      'Drafting statement of work',
      'Time-tracking'
    ]);

    expect(categories[0].tasks[0].startTime).toEqualTime('8:45am');
    expect(categories[0].tasks[0].endTime).toEqualTime('9am');
    expect(categories[0].tasks[0].totalDuration).toEqualDuration(15, 'minutes');

    expect(categories[0].tasks[1].startTime).toEqualTime('11:30am');
    expect(categories[0].tasks[1].endTime).toEqualTime('12pm');
    expect(categories[0].tasks[1].totalDuration).toEqualDuration(30, 'minutes');

    expect(categories[0].tasks[2].startTime).toEqualTime('12pm');
    expect(categories[0].tasks[2].endTime).toEqualTime('12:15pm');
    expect(categories[0].tasks[2].totalDuration).toEqualDuration(15, 'minutes');

    expect(categories[0].tasks[3].startTime).toEqualTime('1:15pm');
    expect(categories[0].tasks[3].endTime).toEqualTime('2pm');
    expect(categories[0].tasks[3].totalDuration).toEqualDuration(45, 'minutes');

    expect(categories[0].totalDuration).toEqualDuration(105, 'minutes');

    // Client A

    expect(categories[1]).toHaveProperty('name', 'Client A');
    expect(categories[1]).toHaveProperty('descriptions', [
      'Daily review call',
      'Troubleshooting session',
      'Development environment setup call',
      'Soft launch'
    ]);

    expect(categories[1].tasks[0].startTime).toEqualTime('9am');
    expect(categories[1].tasks[0].endTime).toEqualTime('10:30am');
    expect(categories[1].tasks[0].totalDuration).toEqualDuration(90, 'minutes');

    expect(categories[1].tasks[1].startTime).toEqualTime('10:30am');
    expect(categories[1].tasks[1].endTime).toEqualTime('11:30am');
    expect(categories[1].tasks[1].totalDuration).toEqualDuration(60, 'minutes');

    expect(categories[1].tasks[2].startTime).toEqualTime('2pm');
    expect(categories[1].tasks[2].endTime).toEqualTime('3pm');
    expect(categories[1].tasks[2].totalDuration).toEqualDuration(60, 'minutes');

    expect(categories[1].tasks[3].startTime).toEqualTime('10pm');
    expect(categories[1].tasks[3].endTime).toEqualMoment(
      moment('12am', 'h:mma')
      .add(1, 'day')
    );
    expect(categories[1].tasks[3].totalDuration).toEqualDuration(120, 'minutes');

    expect(categories[1].totalDuration).toEqualDuration(330, 'minutes');

    // Client B

    expect(categories[2]).toHaveProperty('name', 'Client B');
    expect(categories[2]).toHaveProperty('descriptions', [
      'Updating engine with new feature',
      'Email correspondence'
    ]);
    expect(categories[2].tasks[0].startTime).toEqualTime('3pm');
    expect(categories[2].tasks[0].endTime).toEqualTime('6pm');
    expect(categories[2].tasks[0].totalDuration).toEqualDuration(180, 'minutes');

    expect(categories[2].tasks[1].startTime).toEqualTime('6pm');
    expect(categories[2].tasks[1].endTime).toEqualTime('6:15pm');
    expect(categories[2].tasks[1].totalDuration).toEqualDuration(15, 'minutes');

    expect(categories[2].totalDuration).toEqualDuration(195, 'minutes');

    // Totals

    expect(log.totalDuration).toEqualDuration(630, 'minutes');
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(2);
    expect(log.gaps[0].startTime).toEqualTime('12:15pm');
    expect(log.gaps[0].endTime).toEqualTime('1:15pm');
    expect(log.gaps[1].startTime).toEqualTime('6:15pm');
    expect(log.gaps[1].endTime).toEqualTime('10pm');
    expect(log.overlaps).toHaveLength(0);
  });

  it('should allow for minute-wise times', () => {
    const log = createLog(logs['./test-logs/minutewise.json']);
    const category = log.categories[0];
    expect(category).toHaveProperty('name', 'Internal');
    expect(category.tasks[0].startTime).toEqualTime('8:48am');
    expect(category.tasks[0].endTime).toEqualTime('8:55am');
    expect(category.tasks[1].startTime).toEqualTime('8:55am');
    expect(category.tasks[1].endTime).toEqualTime('9:06am');
    expect(category.tasks[0].totalDuration).toEqualDuration(7, 'minutes');
    expect(category.tasks[1].totalDuration).toEqualDuration(11, 'minutes');
    expect(category.totalDuration).toEqualDuration(18, 'minutes');
    expect(log.totalDuration).toEqualDuration(18, 'minutes');
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(0);
    expect(log.overlaps).toHaveLength(0);
  });

  it('should handle outer overlap (case 1)', () => {
    const { overlaps } = createLog(logs['./test-logs/overlap-outer.json']);
    expect(overlaps[0].startTime).toEqualTime('9am');
    expect(overlaps[0].endTime).toEqualTime('10am');
    expect(overlaps).toHaveLength(1);
  });

  it('should handle inner overlap (case 2)', () => {
    const { overlaps } = createLog(logs['./test-logs/overlap-inner.json']);
    expect(overlaps[0].startTime).toEqualTime('9:15am');
    expect(overlaps[0].endTime).toEqualTime('9:45am');
    expect(overlaps).toHaveLength(1);
  });

  it('should handle leftward overlap (case 3)', () => {
    const { overlaps } = createLog(logs['./test-logs/overlap-left.json']);
    expect(overlaps[0].startTime).toEqualTime('9am');
    expect(overlaps[0].endTime).toEqualTime('9:30am');
    expect(overlaps).toHaveLength(1);
  });

  it('should handle rightward overlap (also case 3)', () => {
    const { overlaps } = createLog(logs['./test-logs/overlap-right.json']);
    expect(overlaps[0].startTime).toEqualTime('9am');
    expect(overlaps[0].endTime).toEqualTime('9:30am');
    expect(overlaps[1].startTime).toEqualTime('9am');
    expect(overlaps[1].endTime).toEqualTime('10am');
    expect(overlaps).toHaveLength(2);
  });

  it('should have no gaps in cases of outward overlap (case 1)', () => {
    const { gaps } = createLog(logs['./test-logs/overlap-outer.json']);
    expect(gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of inward overlap (case 2)', () => {
    const { gaps } = createLog(logs['./test-logs/overlap-inner.json']);
    expect(gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of leftward overlap (case 3)', () => {
    const { gaps } = createLog(logs['./test-logs/overlap-left.json']);
    expect(gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of rightward overlap (case 4)', () => {
    const { gaps } = createLog(logs['./test-logs/overlap-right.json']);
    expect(gaps).toHaveLength(0);
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
