import { findByText, queryByText, waitFor } from '@testing-library/dom';
import * as idbKeyval from 'idb-keyval';
import basicLogTestCase from '../test-cases/basic.json';
import {
  applyLogContentsToApp,
  describeWithIndexedDBDisabled,
  getStorageKeyFromDays,
  renderApp,
  saveToLocalStorage,
  unmountApp
} from '../utils.js';

const storageUpgradePanelHeading = 'Upgrading Database...';

describe('storage upgrader', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should trigger when local storage is populated', async () => {
    const logContents = basicLogTestCase.logContents;
    await applyLogContentsToApp({ 0: logContents }, saveToLocalStorage);
    expect(localStorage).toHaveLength(1);
    await renderApp();
    expect(
      await findByText(document.body, storageUpgradePanelHeading)
    ).toBeInTheDocument();
    await waitFor(async () => {
      expect(localStorage).toHaveLength(0);
      expect(await idbKeyval.keys()).toHaveLength(1);
      expect(await idbKeyval.get(getStorageKeyFromDays(0))).toEqual(
        logContents
      );
    });
  });

  describeWithIndexedDBDisabled('backwards-compatibility', () => {
    it('should skip storage upgrade if browser does not support indexedDB', async () => {
      const logContents = basicLogTestCase.logContents;
      await applyLogContentsToApp({ 0: logContents }, saveToLocalStorage);
      expect(localStorage).toHaveLength(1);
      await renderApp();
      try {
        expect(
          await findByText(document.body, storageUpgradePanelHeading)
        ).toBeInTheDocument();
      } catch (error) {
        // Proceed to the next assertion
      }
      await waitFor(() => {
        expect(
          queryByText(document.body, storageUpgradePanelHeading)
        ).not.toBeInTheDocument();
        expect(localStorage).toHaveLength(1);
      });
    });
  });
});
