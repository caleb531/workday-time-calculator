import { fireEvent, getByRole, getByText, waitFor } from '@testing-library/dom';
import { renderApp, unmountApp } from '../utils.js';

describe('app preferences', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    const getToolsControl = () =>
      getByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
    const getPrefsMenuItem = () => getByText(document.body, 'Preferences');
    await waitFor(() => {
      expect(getToolsControl()).toBeInTheDocument();
    });
    fireEvent.click(getToolsControl());
    await waitFor(() => {
      expect(getPrefsMenuItem()).toBeInTheDocument();
    });
    fireEvent.click(getPrefsMenuItem());
    await waitFor(() => {
      expect(
        getByRole(document.body, 'heading', { name: 'Preferences' })
      ).toBeInTheDocument();
    });
  });
});
