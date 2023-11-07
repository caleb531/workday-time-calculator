import { findByRole, findByText } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { renderApp, unmountApp } from '../utils.js';

describe('app preferences', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    const getToolsControl = () =>
      findByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
    const getPrefsMenuItem = () => findByText(document.body, 'Preferences');
    expect(await getToolsControl()).toBeInTheDocument();
    userEvent.click(await getToolsControl());
    expect(await getPrefsMenuItem()).toBeInTheDocument();
    userEvent.click(await getPrefsMenuItem());
    expect(
      await findByRole(document.body, 'heading', { name: 'Preferences' })
    ).toBeInTheDocument();
  });
});
