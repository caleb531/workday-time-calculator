import m from 'mithril';
import moment from 'moment';
import appStorage from '../models/app-storage.js';

class ExportComponent {
  oninit({ attrs: { preferences } }) {
    this.preferences = preferences;
  }

  getExportedJson() {
    let exportedData = {
      logs: {},
      preferences: this.preferences
    };
    return appStorage
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            let logMatches = key.match(/^wtc-date-(\d{1,2}\/\d{1,2}\/\d{4})$/);
            if (logMatches) {
              let logDate = logMatches[1];
              return appStorage.get(key).then((logContents) => {
                if (
                  !(
                    logContents.ops.length === 1 &&
                    logContents.ops[0].insert === '\n'
                  )
                ) {
                  exportedData.logs[logDate] = logContents;
                  return logContents;
                }
                return null;
              });
            }
            return null;
          })
        );
      })
      .then(() => exportedData);
  }

  downloadExportedJson() {
    this.getExportedJson().then((exportedJson) => {
      let a = document.createElement('a');
      a.href = URL.createObjectURL(
        new Blob([JSON.stringify(exportedJson)], { type: 'application/json' })
      );
      a.download = `wtc-logs-thru-${moment().format('YYYY-MM-DD')}.json`;
      a.click();
    });
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
