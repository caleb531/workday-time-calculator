import Log from '../scripts/models/log';

export function createLog(logContents, options = { calculateStats: true }) {
  return new Log(logContents, options);
}
