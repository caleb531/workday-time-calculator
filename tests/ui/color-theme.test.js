import { findByLabelText, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import * as idbKeyval from 'idb-keyval';
import { openPreferences, renderApp, unmountApp } from '../utils.js';

describe('color theme', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should be able to be changed by user', async () => {
    await renderApp();
    expect(document.body).toHaveClass('color-theme-blue');
    await openPreferences();
    await userEvent.click(await findByLabelText(document.body, 'Rose'));
    await waitFor(() => {
      expect(document.body).toHaveClass('color-theme-rose');
    });
    expect(await idbKeyval.get('wtc-prefs')).toHaveProperty(
      'colorTheme',
      'rose'
    );
  });
});
