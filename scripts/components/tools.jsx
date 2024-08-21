import clsx from 'clsx';
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
    return (
      <div
        className={clsx('app-tools', { 'app-tools-open': this.toolsMenuOpen })}
      >
        <button
          aria-label="Toggle Tools Menu"
          onclick={() => {
            this.toolsMenuOpen = !this.toolsMenuOpen;
          }}
          className="app-tools-menu-toggle"
        >
          <WrenchIconComponent />
        </button>
        {this.toolsMenuOpen ? (
          <DismissableOverlayComponent
            aria-label="Close Tools Menu"
            onDismiss={() => {
              this.toolsMenuOpen = false;
            }}
          />
        ) : null}
        <ul
          className={clsx('app-tools-menu', {
            'app-tools-open': this.toolsMenuOpen
          })}
          onclick={() => {
            this.toolsMenuOpen = false;
          }}
        >
          <li>
            <ImportComponent preferences={preferences} />
          </li>
          <li>
            <ExportComponent preferences={preferences} />
          </li>
          <li
            onclick={() => {
              this.preferencesOpen = true;
            }}
          >
            <span className="app-control-preferences">Preferences</span>
          </li>
        </ul>
        {this.preferencesOpen ? (
          <PreferencesComponent
            preferences={preferences}
            preferencesOpen={this.preferencesOpen}
            onClosePreferences={() => {
              this.preferencesOpen = false;
              m.redraw();
            }}
          />
        ) : null}
      </div>
    );
  }
}

export default ToolsComponent;
