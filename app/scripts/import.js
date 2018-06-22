class ImportComponent {

  import() {
    console.log('import!');
  }

  view() {
    return m('span.app-control-import', {
      onclick: (event) => {
        event.preventDefault();
        this.import();
      }
    }, 'Import');
  }

}

export default ImportComponent;
