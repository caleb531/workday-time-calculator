class ImportComponent {

  import() {
    console.log('import!');
  }

  view() {
    return m('a[href=#]', {
      onclick: (event) => {
        event.preventDefault();
        this.import();
      }
    }, 'Import');
  }

}

export default ImportComponent;
