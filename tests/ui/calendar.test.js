import moment from 'moment';
import m from 'mithril';
import {
  getByText,
  getAllByText,
  getByRole,
  waitFor,
  fireEvent
} from '@testing-library/dom';
import {
  forEachTestCase,
  renderApp,
  unmountApp,
  applyLogContentsToApp,
  formatDuration,
  formatTime
} from '../utils.js';

describe('log calendar', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should open', async () => {
    await renderApp();
    await waitFor(() => {
      expect(
        getByRole(document.body, 'button', { name: 'Toggle Calendar' })
      ).toBeInTheDocument();
    });
    fireEvent.click(
      getByRole(document.body, 'button', { name: 'Toggle Calendar' })
    );
    await waitFor(() => {
      expect(
        getByText(document.body, moment().format('MMMM YYYY'))
      ).toBeInTheDocument();
    });
  });
});
