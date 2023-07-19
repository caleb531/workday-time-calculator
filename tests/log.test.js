import moment from 'moment';
import Log from '../scripts/models/log';
import basicLogContents from './test-logs/basic.json';
import noDescriptionsLogContents from './test-logs/no-descriptions.json';
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
