class ExportComponent {

  exportAll() {
    console.log('export all!');
  }

  view() {
    return m('span.app-control-export', {
      onclick: (event) => {
        event.preventDefault();
        this.exportAll();
      }
    }, 'Export All');
  }

}

export default ExportComponent;
