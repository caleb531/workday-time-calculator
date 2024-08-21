import { fromPairs } from 'lodash-es';
import moment from 'moment';
import appStorage from '../models/app-storage.js';

class ExportComponent {
  oninit({ attrs: { preferences } }) {
    this.preferences = preferences;
  }

  async getExportedJson() {
    const entries = await appStorage.entries();
    let exportedData = {
      logs: fromPairs(
        entries
          // Exclude storage entries which aren't log entries
          .map(([key, value]) => {
            let logKeyMatches = key.match(
              /^wtc-date-(\d{1,2}\/\d{1,2}\/\d{4})$/
            );
            return [logKeyMatches, value];
          })
          .filter(([logKeyMatches]) => logKeyMatches)
          // Exclude empty log entries
          .filter(([, logContents]) => {
            return !(
              logContents?.ops.length === 1 &&
              logContents?.ops[0].insert === '\n'
            );
          })
          // Index each log entry by its date
          .map(([logKeyMatches, logContents]) => {
            const logDate = logKeyMatches[1];
            return [logDate, logContents];
          })
      ),
      preferences: this.preferences
    };
    return exportedData;
  }

  async downloadExportedJson() {
    const exportedJson = await this.getExportedJson();
    let a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(exportedJson)], { type: 'application/json' })
    );
    a.download = `wtc-logs-thru-${moment().format('YYYY-MM-DD')}.json`;
    a.click();
  }

  view() {
    return (
      <span
        className="app-control-export"
        onclick={() => {
          this.downloadExportedJson();
        }}
      >
        Export All
      </span>
    );
  }
}

export default ExportComponent;
