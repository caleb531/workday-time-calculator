class ImportComponent {

  browseForJsonFile() {
    console.log('import!');
  }

  uploadJsonFiles(files) {
    console.log(files);
  }

  view() {
    return m('span.app-control-import', {
      onclick: () => {
        this.browseForJsonFile();
      }
    }, [
      m('input[type="file"].app-control-import-input', {
        accept: 'application/json',
        onchange: (event) => {
          this.uploadJsonFiles(event.target.files);
        }
      }),
      'Import'
    ]);
  }

}

export default ImportComponent;
