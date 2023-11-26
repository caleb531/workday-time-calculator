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
    expect(
      document.body.style.getPropertyValue('--current-color-theme-color')
    ).toContain('var(--color-theme-color-blue)');
    await openPreferences();
    await clickPreferenceOption('Color Theme', 'Rose');
    await waitFor(() => {
      expect(
        document.body.style.getPropertyValue('--current-color-theme-color')
      ).toEqual('var(--color-theme-color-rose)');
    });
    expect(await idbKeyval.get('wtc-prefs')).toHaveProperty(
      'colorTheme',
      'rose'
    );
  });
});
