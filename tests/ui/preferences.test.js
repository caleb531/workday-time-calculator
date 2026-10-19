import { findByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '../../styles/index.scss';
import { openPreferences, renderApp, unmountApp } from '../utils.js';

describe('preferences keyboard navigation', () => {
  // Remove the mounted app and its stored state after each keyboard test
  afterEach(async () => {
    await unmountApp();
  });

  // Check that Tab reaches the selected option in each native radio group
  it('tabs through the selected preference options', async () => {
    await renderApp();
    await openPreferences();
    await findByRole(document.body, 'heading', { name: 'Preferences' });

    // The close control appears immediately before the preference fields
    const closeControl = document.querySelector(
      '.app-preferences .close-button'
    );
    closeControl.focus();

    // The saved color is the first radio group reached from the close control
    const selectedColor = await findByRole(document.body, 'radio', {
      name: 'Blue'
    });
    await userEvent.tab();
    expect(selectedColor).toHaveFocus();

    // The saved reminder interval is the next radio group in document order
    const selectedReminderInterval = await findByRole(document.body, 'radio', {
      name: 'Never'
    });
    await userEvent.tab();
    expect(selectedReminderInterval).toHaveFocus();
  });
});
