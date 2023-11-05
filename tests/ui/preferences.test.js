import { fireEvent, getByRole, getByText, waitFor } from '@testing-library/dom';
import { renderApp, unmountApp } from '../utils.js';

describe('app preferences', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    await waitFor(() => {
      expect(
        getByRole(document.body, 'button', { name: 'Toggle Tools Menu' })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      getByRole(document.body, 'button', { name: 'Toggle Tools Menu' })
    );
    await waitFor(() => {
      expect(getByText(document.body, 'Preferences')).toBeInTheDocument();
    });
    fireEvent.click(getByText(document.body, 'Preferences'));
    await waitFor(() => {
      expect(
        getByRole(document.body, 'heading', { name: 'Preferences' })
      ).toBeInTheDocument();
    });
  });
});
