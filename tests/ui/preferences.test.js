import {
  findByLabelText,
  findByRole,
  findByText,
  waitFor
} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import * as idbKeyval from 'idb-keyval';
import { renderApp, unmountApp } from '../utils.js';

async function openPreferences() {
  const getToolsControl = () =>
    findByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
  const getPrefsMenuItem = () => findByText(document.body, 'Preferences');
  expect(await getToolsControl()).toBeInTheDocument();
  userEvent.click(await getToolsControl());
  expect(await getPrefsMenuItem()).toBeInTheDocument();
  userEvent.click(await getPrefsMenuItem());
}

describe('app preferences', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    await openPreferences();
    expect(
      await findByRole(document.body, 'heading', { name: 'Preferences' })
    ).toBeInTheDocument();
  });

  it('should change theme', async () => {
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
