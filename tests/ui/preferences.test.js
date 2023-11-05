import { getByRole, getByText, waitFor } from '@testing-library/dom';
import { renderApp, unmountApp, waitForAndClick } from '../utils.js';

describe('app preferences', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    await waitForAndClick(() => {
      return getByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
    });
    await waitForAndClick(() => {
      return getByText(document.body, 'Preferences');
    });
    await waitFor(() => {
      expect(
        getByRole(document.body, 'heading', { name: 'Preferences' })
      ).toBeInTheDocument();
    });
  });
});
