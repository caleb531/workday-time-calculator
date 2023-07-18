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
import './test-utils.js';

describe('Log model', () => {

  it('should instantiate basic log', () => {
    const log = new Log(basicLogContents, {calculateStats: true});
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
    const log = new Log(noDescriptionsLogContents, {calculateStats: true});
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
    const log = new Log(overlapOuterLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime).toEqualTime('9am');
    expect(overlap.endTime).toEqualTime('10am');
    expect(log.overlaps).toHaveLength(1);
  });

  it('should handle inner overlap (case 2)', () => {
    const log = new Log(overlapInnerLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime).toEqualTime('9:15am');
    expect(overlap.endTime).toEqualTime('9:45am');
    expect(log.overlaps).toHaveLength(1);
  });

  it('should handle leftward overlap (case 3)', () => {
    const log = new Log(overlapLeftLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime).toEqualTime('9am');
    expect(overlap.endTime).toEqualTime('9:30am');
    expect(log.overlaps).toHaveLength(1);
  });

  it('should handle rightward overlap (case 4)', () => {
    const log = new Log(overlapRightLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime).toEqualTime('9am');
    expect(overlap.endTime).toEqualTime('9:30am');
    expect(log.overlaps).toHaveLength(1);
  });

  it('should have no gaps in cases of outward overlap (case 1)', () => {
    const log = new Log(overlapOuterLogContents, {calculateStats: true});
    expect(log.gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of inward overlap (case 2)', () => {
    const log = new Log(overlapInnerLogContents, {calculateStats: true});
    expect(log.gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of leftward overlap (case 3)', () => {
    const log = new Log(overlapLeftLogContents, {calculateStats: true});
    expect(log.gaps).toHaveLength(0);
  });

  it('should have no gaps in cases of rightward overlap (case 4)', () => {
    const log = new Log(overlapRightLogContents, {calculateStats: true});
    expect(log.gaps).toHaveLength(0);
  });

  it('should detect single gaps', () => {
    const log = new Log(gapSingleLogContents, {calculateStats: true});
    const gap = log.gaps[0];
    expect(gap.startTime).toEqualTime('9:30am');
    expect(gap.endTime).toEqualTime('10:15am');
    expect(log.gaps).toHaveLength(1);
  });

  it('should detect multiple gaps', () => {
    const log = new Log(gapMultipleLogContents, {calculateStats: true});
    const gaps = log.gaps;
    expect(gaps[0].startTime).toEqualTime('9am');
    expect(gaps[0].endTime).toEqualTime('9:30am');
    expect(gaps[1].startTime).toEqualTime('10:15am');
    expect(gaps[1].endTime).toEqualTime('10:30am');
    expect(gaps[1].startTime).toEqualTime('10:15am');
    expect(gaps[1].endTime).toEqualTime('10:30am');
    expect(gaps[2].startTime).toEqualTime('11:45am');
    expect(gaps[2].endTime).toEqualTime('12:15pm');
    expect(log.gaps).toHaveLength(3);
  });

});
