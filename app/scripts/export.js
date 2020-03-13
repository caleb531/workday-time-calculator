import m from 'mithril';
import moment from 'moment';

class ExportComponent {

  oninit({attrs: {preferences}}) {
    this.preferences = preferences;
  }

  getExportedJson() {
    let exportedData = {
      logs: {},
      preferences: this.preferences
    };
    Object.keys(localStorage).forEach((key) => {
      let logMatches = key.match(/^wtc-date-(\d{1,2}\/\d{1,2}\/\d{4})$/);
      if (logMatches) {
        let logDate = logMatches[1];
        let logContents = JSON.parse(localStorage.getItem(key));
        if (!(logContents.ops.length === 1 && logContents.ops[0].insert === '\n')) {
          exportedData.logs[logDate] = logContents;
        }
      }
    });
    return exportedData;
  }

  downloadExportedJson() {
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([
      JSON.stringify(this.getExportedJson())
    ], {type: 'application/json'}));
    a.download = `wtc-logs-thru-${moment().format('YYYY-MM-DD')}.json`;
    a.click();
  }

  view() {
    return m('span.app-control-export', {
      onclick: () => {
        this.downloadExportedJson();
      }
    }, 'Export All');
  }

}

export default ExportComponent;
