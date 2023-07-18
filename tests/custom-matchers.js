import moment from 'moment';

expect.extend({
  // Check if a Moment object is equivalent to the given time string
  toEqualTime: (actualTime, expectedTimeStr) => {
    const expectedTime = moment(expectedTimeStr, 'h:mma');
    const message = () => `expected ${actualTime.format('h:mma')} to equal ${expectedTimeStr}`;
    if (actualTime.toString() === expectedTime.toString()) {
      return { message, pass: true };
    } else {
      return { message, pass: false };
    }
  },
  // Check if a Moment Duration object is equivalent to the given duration parameters
  toEqualDuration: (actualDuration, expectedDurationValue, expectedDurationUnits) => {
    const expectedDuration = moment.duration(expectedDurationValue, expectedDurationUnits);
    const message = () => `expected ${actualDuration.humanize()} to equal ${expectedDuration.humanize()}`;
    if (actualDuration.toString() === expectedDuration.toString()) {
      return { message, pass: true };
    } else {
      return { message, pass: false };
    }
  }
});
