import moment from 'moment';

const dateTimeDisplayFormat = 'M/D/YYYY h:mma';

expect.extend({
  // Check if a Moment object is equivalent to another Moment object
  toEqualMoment: (actualTime, expectedTime) => {
    const message = () => `expected ${actualTime.format(dateTimeDisplayFormat)} to equal ${expectedTime.format(dateTimeDisplayFormat)}`;
    if (actualTime.isSame(expectedTime)) {
      return { message, pass: true };
    } else {
      return { message, pass: false };
    }
  },
  // Check if a Moment object is equivalent to the given time string
  toEqualTime: (actualTime, expectedTimeStr) => {
    const expectedTime = moment(expectedTimeStr, 'h:mma');
    const message = () => `expected ${actualTime.format(dateTimeDisplayFormat)} to equal ${expectedTime.format(dateTimeDisplayFormat)}`;
    if (actualTime.toString() === expectedTime.toString()) {
      return { message, pass: true };
    } else {
      return { message, pass: false };
    }
  },
  // Check if a Moment Duration object is equivalent to the given duration parameters
  toEqualDuration: (actualDuration, expectedDurationValue, expectedDurationUnits) => {
    const expectedDuration = moment.duration(expectedDurationValue, expectedDurationUnits);
    const message = () => `expected ${actualDuration.asMinutes()} minute(s) to equal ${expectedDuration.asMinutes()} minute(s)`;
    if (actualDuration.toString() === expectedDuration.toString()) {
      return { message, pass: true };
    } else {
      return { message, pass: false };
    }
  }
});
