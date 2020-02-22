import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.js';
import ImportComponent from './import.js';
import ExportComponent from './export.js';
import WrenchIconComponent from './wrench-icon.js';

class ToolsComponent {

  oninit() {
    this.menuIsOpen = false;
  }

  view() {
    return m('div.app-tools', {
      class: this.menuIsOpen ? 'open' : '',
    }, [
      m('button.app-tools-menu-toggle', {
        onclick: () => {
          this.menuIsOpen = !this.menuIsOpen;
        }
      }, m(WrenchIconComponent)),
      m(DismissableOverlayComponent, {
        onDismiss: () => {
          this.menuIsOpen = false;
        }
      }),
      m('ul.app-tools-menu', {
        class: this.menuIsOpen ? 'open' : '',
        // Close menu when menu item is clicked
        onclick: () => {
          this.menuIsOpen = false;
        }
      }, [
        m('li', m(ImportComponent)),
        m('li', m(ExportComponent)),
      ])
    ]);
  }

}

export default ToolsComponent;
