import { findByRole, queryByRole, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import '../../styles/index.scss';
import { openPreferences, renderApp, unmountApp } from '../utils.js';

describe('preferences keyboard navigation', () => {
  // Remove the mounted app and its stored state after each keyboard test
  afterEach(async () => {
    await unmountApp();
  });

  it('closes Preferences with Escape from a preference field and can reopen', async () => {
    await renderApp();
    await openPreferences();
    // Escape must work from panel contents rather than only the backdrop
    const color = await findByRole(document.body, 'radio', { name: 'Blue' });
    color.focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        queryByRole(document.body, 'heading', { name: 'Preferences' })
      ).toBeNull()
    );
    await openPreferences();
    await findByRole(document.body, 'heading', { name: 'Preferences' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        queryByRole(document.body, 'heading', { name: 'Preferences' })
      ).toBeNull()
    );
  });

  it('closes only the topmost overlay when panels overlap', async () => {
    await renderApp();
    await openPreferences();
    await findByRole(document.body, 'heading', { name: 'Preferences' });
    // Existing keyboard navigation allows opening Analytics while Preferences is open
    const analyticsToggle = await findByRole(document.body, 'button', {
      name: 'Toggle Analytics'
    });
    analyticsToggle.focus();
    await userEvent.keyboard('{Enter}');
    await findByRole(document.body, 'heading', { name: 'Analytics' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        queryByRole(document.body, 'heading', { name: 'Analytics' })
      ).toBeNull()
    );
    expect(
      await findByRole(document.body, 'heading', { name: 'Preferences' })
    ).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        queryByRole(document.body, 'heading', { name: 'Preferences' })
      ).toBeNull()
    );
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
