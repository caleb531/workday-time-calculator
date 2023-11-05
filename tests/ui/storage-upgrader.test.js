import { getByText, waitFor } from '@testing-library/dom';
import basicLogTestCase from '../test-cases/basic.json';
import {
  applyLogContentsToApp,
  renderApp,
  saveLogContentsToLocalStorage,
  unmountApp
} from '../utils.js';

describe('storage upgrader', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should trigger when local storage is populated', async () => {
    await applyLogContentsToApp(
      { 0: basicLogTestCase.logContents },
      saveLogContentsToLocalStorage
    );
    await renderApp();
    await waitFor(() => {
      expect(
        getByText(document.body, 'Upgrading Database...')
      ).toBeInTheDocument();
    });
  });
});
