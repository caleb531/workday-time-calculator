import { findByRole, findByText, fireEvent } from '@testing-library/dom';
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
    fireEvent.click(await getToolsControl());
    expect(await getPrefsMenuItem()).toBeInTheDocument();
    fireEvent.click(await getPrefsMenuItem());
    expect(
      await findByRole(document.body, 'heading', { name: 'Preferences' })
    ).toBeInTheDocument();
  });
});
