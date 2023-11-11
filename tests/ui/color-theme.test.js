import { waitFor } from '@testing-library/dom';
import * as idbKeyval from 'idb-keyval';
import {
  clickPreferenceOption,
  openPreferences,
  renderApp,
  unmountApp
} from '../utils.js';

describe('color theme', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should be able to be changed by user', async () => {
    await renderApp();
    expect(document.body).toHaveClass('color-theme-blue');
    await openPreferences();
    await clickPreferenceOption('Color Theme', 'Rose');
    await waitFor(() => {
      expect(document.body).toHaveClass('color-theme-rose');
    });
    expect(await idbKeyval.get('wtc-prefs')).toHaveProperty(
      'colorTheme',
      'rose'
    );
  });
});
