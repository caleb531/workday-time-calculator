import m from 'mithril';
import DismissableOverlayComponent from './dismissable-overlay.jsx';
import ExportComponent from './export.jsx';
import ImportComponent from './import.jsx';
import PreferencesComponent from './preferences.jsx';
import WrenchIconComponent from './wrench-icon.jsx';

class ToolsComponent {
  oninit() {
    this.toolsMenuOpen = false;
    this.preferencesOpen = false;
  }

  view({ attrs: { preferences } }) {
    return m(
      'div.app-tools',
      {
        class: this.toolsMenuOpen ? 'app-tools-open' : ''
      },
      [
        m(
          'button.app-tools-menu-toggle',
          {
            'aria-label': 'Toggle Tools Menu',
            onclick: () => {
              this.toolsMenuOpen = !this.toolsMenuOpen;
            }
          },
          m(WrenchIconComponent)
        ),
        this.toolsMenuOpen
          ? m(DismissableOverlayComponent, {
              'aria-label': 'Close Tools Menu',
              onDismiss: () => {
                this.toolsMenuOpen = false;
              }
            })
          : null,
        m(
          'ul.app-tools-menu',
          {
            class: this.toolsMenuOpen ? 'app-tools-open' : '',
            // Close menu when menu item is clicked
            onclick: () => {
              this.toolsMenuOpen = false;
            }
          },
          [
            m('li', m(ImportComponent, { preferences })),
            m('li', m(ExportComponent, { preferences })),
            m(
              'li',
              {
                onclick: () => {
                  this.preferencesOpen = true;
                }
              },
              m('span.app-control-preferences', 'Preferences')
            )
          ]
        ),
        this.preferencesOpen
          ? m(PreferencesComponent, {
              preferences,
              preferencesOpen: this.preferencesOpen,
              onClosePreferences: () => {
                this.preferencesOpen = false;
                m.redraw();
              }
            })
          : null
      ]
    );
  }
}

export default ToolsComponent;
