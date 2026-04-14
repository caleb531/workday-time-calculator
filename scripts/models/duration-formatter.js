function padWithZeroes(value) {
  if (Number(value) < 10) {
    return '0' + value;
  } else {
    return String(value);
  }
}

function getTotalMinutes(durationOrMinutes) {
  if (typeof durationOrMinutes === 'number') {
    return durationOrMinutes;
  }
  return durationOrMinutes.asMinutes();
}

export function formatDuration(durationOrMinutes) {
  const totalMinutes = getTotalMinutes(durationOrMinutes);
  const isNegative = totalMinutes < 0;
  const absoluteMinutes = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `${isNegative ? '-' : ''}${hours}:${padWithZeroes(minutes)}`;
}

export { padWithZeroes };