import ImportComponent from './import.js';
import ExportComponent from './export.js';
import WrenchIconComponent from './wrench-icon.js';

class ControlsComponent {

  oninit() {
    this.menuIsOpen = false;
  }

  view() {
    return m('div.app-tools', [
      m('div.app-tools-menu-toggle', {
        onclick: () => {
          this.menuIsOpen = !this.menuIsOpen;
        }
      }, m(WrenchIconComponent)),
      m('ul.app-tools-menu', {
        class: this.menuIsOpen ? 'open' : ''
      }, [
        m('li', m(ImportComponent)),
        m('li', m(ExportComponent)),
      ])
    ]);
  }

}

export default ControlsComponent;
