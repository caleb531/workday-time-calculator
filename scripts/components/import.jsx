import appStorage from '../models/app-storage.js';

class ImportComponent {
  oninit({ attrs: { preferences } }) {
    this.preferences = preferences;
  }

  importJsonFile(jsonFile) {
    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.onload = (event) => {
        let importedData = JSON.parse(event.target.result);
        resolve(
          Promise.all(
            Object.keys(importedData.logs).map((logDate) => {
              let logContent = importedData.logs[logDate];
              return appStorage.set(`wtc-date-${logDate}`, logContent);
            })
          ).then(() => {
            if (importedData.preferences) {
              this.preferences.set(importedData.preferences, {
                emit: false
              });
              return this.preferences.save();
            }
          })
        );
      };
      reader.readAsText(jsonFile);
    });
  }

  view() {
    return (
      <label htmlFor="app-control-import-input">
        <input
          type="file"
          className="app-control-import-input"
          id="app-control-import-input"
          accept="application/json"
          onchange={async (event) => {
            if (!event.target.files.length) {
              return;
            }
            await this.importJsonFile(event.target.files[0]);
            window.location.reload();
          }}
        />
        <span className="app-control-import-label">Import</span>
      </label>
    );
  }
}

export default ImportComponent;
