import m from 'mithril';

class ImportComponent {

  importJsonFile(jsonFile) {
    let reader = new FileReader();
    reader.onload = (event) => {
      let importedData = JSON.parse(event.target.result);
      Object.keys(importedData.logs).forEach((logDate) => {
        let logContent = importedData.logs[logDate];
        localStorage.setItem(`wtc-date-${logDate}`, JSON.stringify(logContent));
      });
    };
    reader.readAsText(jsonFile);
  }

  view() {
    return m('span.app-control-import', [
      m('input[type="file"].app-control-import-input', {
        accept: 'application/json',
        onchange: (event) => {
          if (event.target.files.length > 0) {
            this.importJsonFile(event.target.files[0]);
            window.location.reload();
          }
        }
      }),
      'Import'
    ]);
  }

}

export default ImportComponent;
