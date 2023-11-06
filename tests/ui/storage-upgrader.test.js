import { findByText, waitFor } from '@testing-library/dom';
import * as idbKeyval from 'idb-keyval';
import basicLogTestCase from '../test-cases/basic.json';
import {
  applyLogContentsToApp,
  getStorageKeyFromDays,
  renderApp,
  saveLogContentsToLocalStorage,
  unmountApp
} from '../utils.js';

describe('storage upgrader', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should trigger when local storage is populated', async () => {
    const logContents = basicLogTestCase.logContents;
    await applyLogContentsToApp(
      { 0: logContents },
      saveLogContentsToLocalStorage
    );
    expect(localStorage).toHaveLength(1);
    await renderApp();
    expect(
      await findByText(document.body, 'Upgrading Database...')
    ).toBeInTheDocument();
    await waitFor(async () => {
      expect(localStorage).toHaveLength(0);
      expect(await idbKeyval.keys()).toHaveLength(1);
      expect(await idbKeyval.get(getStorageKeyFromDays(0))).toEqual(
        logContents
      );
    });
  });
});
