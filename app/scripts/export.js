class ExportComponent {

  exportAll() {
    console.log('export all!');
  }

  view() {
    return m('a[href=#]', {
      onclick: (event) => {
        event.preventDefault();
        this.exportAll();
      }
    }, 'Export All');
  }

}

export default ExportComponent;
