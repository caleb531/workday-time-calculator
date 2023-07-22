import moment from 'moment';
import Log from '../scripts/models/log';
import basicLogContents from './test-logs/basic.json';
import noDescriptionsLogContents from './test-logs/no-descriptions.json';
import minutewiseLogContents from './test-logs/minutewise.json';
import realWorld1LogContents from './test-logs/real-world-1.json';
import realWorld2LogContents from './test-logs/real-world-2.json';
import overlapLeftLogContents from './test-logs/overlap-left.json';
import overlapRightLogContents from './test-logs/overlap-right.json';
import overlapInnerLogContents from './test-logs/overlap-inner.json';
import overlapOuterLogContents from './test-logs/overlap-outer.json';
import gapSingleLogContents from './test-logs/gap-single.json';
import gapMultipleLogContents from './test-logs/gap-multiple.json';
import errorBackwardsLogContents from './test-logs/error-backwards.json';
import errorRepeatedTimeLogContents from './test-logs/error-repeated-time.json';
import { createLog } from './utils.js';
import './custom-matchers.js';

describe('Log model', () => {

  it('should instantiate basic log', () => {
    const log = createLog(basicLogContents);
    const category = log.categories[0];
    expect(category).toHaveProperty('name', 'Internal');
    expect(category).toHaveProperty('descriptions', [
      'Getting started with my day',
      'Performance review self-assessment'
    ]);
    expect(category.tasks[0].startTime).toEqualTime('8:45am');
    expect(category.tasks[0].endTime).toEqualTime('9am');
    expect(category.tasks[0].totalDuration).toEqualDuration(15, 'minutes');
    expect(category.tasks[1].totalDuration).toEqualDuration(210, 'minutes');
    expect(category.totalDuration).toEqualDuration(225, 'minutes');
    expect(log.totalDuration).toEqualDuration(225, 'minutes');
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(0);
    expect(log.overlaps).toHaveLength(0);
  });

  it('should instantiate basic log without descriptions', () => {
    const log = createLog(noDescriptionsLogContents);
    const category = log.categories[0];
    expect(category).toHaveProperty('name', 'Internal');
    expect(category).toHaveProperty('descriptions', []);
    expect(category.tasks[0].startTime).toEqualTime('8:45am');
    expect(category.tasks[0].endTime).toEqualTime('9am');
    expect(category.tasks[0].totalDuration).toEqualDuration(15, 'minutes');
    expect(category.tasks[1].totalDuration).toEqualDuration(210, 'minutes');
    expect(category.totalDuration).toEqualDuration(225, 'minutes');
    expect(log.totalDuration).toEqualDuration(225, 'minutes');
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(0);
    expect(log.overlaps).toHaveLength(0);
  });

  it('should instantiate real-world log with multiple categories, descriptions, and a gap', () => {
    const log = createLog(realWorld1LogContents);
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
    const log = createLog(realWorld2LogContents);
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
    const log = createLog(minutewiseLogContents);
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
    const { overlaps } = createLog(overlapOuterLogContents);
    expect(overlaps[0].startTime).toEqualTime('9am');
    expect(overlaps[0].endTime).toEqualTime('10am');
    expect(overlaps).toHaveLength(1);
  });

  it('should handle inner overlap (case 2)', () => {
    const { overlaps } = createLog(overlapInnerLogContents);
    expect(overlaps[0].startTime).toEqualTime('9:15am');
    expect(overlaps[0].endTime).toEqualTime('9:45am');
    expect(overlaps).toHaveLength(1);
  });

  it('should handle leftward overlap (case 3)', () => {
    const { overlaps } = createLog(overlapLeftLogContents);
    expect(overlaps[0].startTime).toEqualTime('9am');
    expect(overlaps[0].endTime).toEqualTime('9:30am');
    expect(overlaps).toHaveLength(1);
  });

  it('should handle rightward overlap (also case 3)', () => {
    const { overlaps } = createLog(overlapRightLogContents);
    expect(overlaps[0].startTime).toEqualTime('9am');
    expect(overlaps[0].endTime).toEqualTime('9:30am');
    expect(overlaps[1].startTime).toEqualTime('9am');
    expect(overlaps[1].endTime).toEqualTime('10am');
    expect(overlaps).toHaveLength(2);
  });

  it('should have no gaps in cases of outward overlap (case 1)', () => {
    const { gaps } = createLog(overlapOuterLogContents);
    expect(gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of inward overlap (case 2)', () => {
    const { gaps } = createLog(overlapInnerLogContents);
    expect(gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of leftward overlap (case 3)', () => {
    const { gaps } = createLog(overlapLeftLogContents);
    expect(gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of rightward overlap (case 4)', () => {
    const { gaps } = createLog(overlapRightLogContents);
    expect(gaps).toHaveLength(0);
  });

  it('should detect single gaps', () => {
    const { gaps } = createLog(gapSingleLogContents);
    expect(gaps[0].startTime).toEqualTime('9:30am');
    expect(gaps[0].endTime).toEqualTime('10:15am');
    expect(gaps).toHaveLength(1);
  });

  it('should detect multiple gaps', () => {
    const { gaps } = createLog(gapMultipleLogContents);
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
    const { errors } = createLog(errorBackwardsLogContents);
    expect(errors[0].startTime).toEqualTime('9am');
    expect(errors[0].endTime).toEqualTime('8:30am');
    expect(errors).toHaveLength(1);
  });

  it('should flag repeated time (within the same range) as an error', () => {
    const { errors } = createLog(errorRepeatedTimeLogContents);
    expect(errors[0].startTime).toEqualTime('9am');
    expect(errors[0].endTime).toEqualTime('9am');
    expect(errors).toHaveLength(1);
  });

});
