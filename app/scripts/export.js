class ExportComponent {

  getExportedJson() {
    let exportedData = {logs: {}};
    Object.keys(localStorage).forEach((key) => {
      let logMatches = key.match(/^wtc-date-(\d{1,2}\/\d{1,2}\/\d{4})$/);
      if (logMatches) {
        let logDate = logMatches[1];
        exportedData.logs[logDate] = localStorage.getItem(key);
      }
    });
    return exportedData;
  }

  downloadExportedJson() {
    let a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([
      JSON.stringify(this.getExportedJson())
    ], {type: 'application/json'}));
    a.download = 'logs.json';
    a.click();
  }

  view() {
    return m('span.app-control-export', {
      onclick: (event) => {
        event.preventDefault();
        this.downloadExportedJson();
      }
    }, 'Export All');
  }

}

export default ExportComponent;
