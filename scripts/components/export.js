import m from 'mithril';
import moment from 'moment';
import appStorage from '../models/app-storage.js';

class ExportComponent {
  oninit({ attrs: { preferences } }) {
    this.preferences = preferences;
  }

  async getExportedJson() {
    let exportedData = {
      logs: {},
      preferences: this.preferences
    };
    const keys = await appStorage.keys();
    await Promise.all(
      keys.map(async (key) => {
        let logMatches = key.match(/^wtc-date-(\d{1,2}\/\d{1,2}\/\d{4})$/);
        if (!logMatches) {
          return null;
        }
        let logDate = logMatches[1];
        const logContents = await appStorage.get(key);
        if (
          !(
            logContents?.ops.length === 1 && logContents?.ops[0].insert === '\n'
          )
        ) {
          exportedData.logs[logDate] = logContents;
          return logContents;
        } else {
          return null;
        }
      })
    );
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
    return m(
      'span.app-control-export',
      {
        onclick: () => {
          this.downloadExportedJson();
        }
      },
      'Export All'
    );
  }
}

export default ExportComponent;
