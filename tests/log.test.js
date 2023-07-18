import moment from 'moment';
import Log from '../scripts/models/log';
import basicLogContents from './test-logs/basic.json';
import noDescriptionsLogContents from './test-logs/no-descriptions.json';
import overlapLeftLogContents from './test-logs/overlap-left.json';
import overlapRightLogContents from './test-logs/overlap-right.json';
import overlapInnerLogContents from './test-logs/overlap-inner.json';
import overlapOuterLogContents from './test-logs/overlap-outer.json';

describe('Log model', () => {

  it('should instantiate basic log', () => {
    const log = new Log(basicLogContents, {calculateStats: true});
    const category = log.categories[0];
    expect(category).toHaveProperty('name', 'Internal');
    expect(category).toHaveProperty('descriptions', [
      'Getting started with my day',
      'Performance review self-assessment'
    ]);
    expect(category.tasks[0].startTime.toString()).toEqual(
      moment('8:45am', 'h:mma').toString()
    );
    expect(category.tasks[0].endTime.toString()).toEqual(
      moment('9am', 'h:mma').toString()
    );
    expect(category.tasks[0].totalDuration.toString()).toEqual(
      moment.duration(15, 'minutes').toString()
    );
    expect(category.tasks[1].totalDuration.toString()).toEqual(
      moment.duration(210, 'minutes').toString()
    );
    expect(category.totalDuration.toString()).toEqual(
      moment.duration(225, 'minutes').toString()
    );
    expect(log.totalDuration.toString()).toEqual(
      moment.duration(225, 'minutes').toString()
    );
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(0);
    expect(log.overlaps).toHaveLength(0);
  });

  it('should instantiate basic log without descriptions', () => {
    const log = new Log(noDescriptionsLogContents, {calculateStats: true});
    const category = log.categories[0];
    expect(category).toHaveProperty('name', 'Internal');
    expect(category).toHaveProperty('descriptions', []);
    expect(category.tasks[0].startTime.toString()).toEqual(
      moment('8:45am', 'h:mma').toString()
    );
    expect(category.tasks[0].endTime.toString()).toEqual(
      moment('9am', 'h:mma').toString()
    );
    expect(category.tasks[0].totalDuration.toString()).toEqual(
      moment.duration(15, 'minutes').toString()
    );
    expect(category.tasks[1].totalDuration.toString()).toEqual(
      moment.duration(210, 'minutes').toString()
    );
    expect(category.totalDuration.toString()).toEqual(
      moment.duration(225, 'minutes').toString()
    );
    expect(log.totalDuration.toString()).toEqual(
      moment.duration(225, 'minutes').toString()
    );
    expect(log.errors).toHaveLength(0);
    expect(log.gaps).toHaveLength(0);
    expect(log.overlaps).toHaveLength(0);
  });

  it('should handle outer overlap (case 1)', () => {
    const log = new Log(overlapOuterLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime.toString()).toEqual(
      moment('9am', 'h:mma').toString()
    );
    expect(overlap.endTime.toString()).toEqual(
      moment('10am', 'h:mma').toString()
    );
    expect(log.overlaps).toHaveLength(1);
  });

  it('should handle inner overlap (case 2)', () => {
    const log = new Log(overlapInnerLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime.toString()).toEqual(
      moment('9:15am', 'h:mma').toString()
    );
    expect(overlap.endTime.toString()).toEqual(
      moment('9:45am', 'h:mma').toString()
    );
    expect(log.overlaps).toHaveLength(1);
  });

  it('should handle leftward overlap (case 3)', () => {
    const log = new Log(overlapLeftLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime.toString()).toEqual(
      moment('9am', 'h:mma').toString()
    );
    expect(overlap.endTime.toString()).toEqual(
      moment('9:30am', 'h:mma').toString()
    );
    expect(log.overlaps).toHaveLength(1);
  });

  it('should handle rightward overlap (case 4)', () => {
    const log = new Log(overlapRightLogContents, {calculateStats: true});
    const overlap = log.overlaps[0];
    expect(overlap.startTime.toString()).toEqual(
      moment('9am', 'h:mma').toString()
    );
    expect(overlap.endTime.toString()).toEqual(
      moment('9:30am', 'h:mma').toString()
    );
    expect(log.overlaps).toHaveLength(1);
  });

});
