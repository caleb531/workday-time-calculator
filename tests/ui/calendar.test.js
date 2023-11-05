import { getByRole, getByText, waitFor } from '@testing-library/dom';
import moment from 'moment';
import { renderApp, unmountApp, waitForAndClick } from '../utils.js';

describe('log calendar', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    await waitForAndClick(() => {
      return getByRole(document.body, 'button', { name: 'Toggle Calendar' });
    });
    await waitFor(() => {
      expect(
        getByText(document.body, moment().format('MMMM YYYY'))
      ).toBeInTheDocument();
    });
  });
});
