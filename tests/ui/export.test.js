import { findByRole, findByText, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { fromPairs } from 'lodash-es';
import moment from 'moment';
import Preferences from '../../scripts/models/preferences.js';
import {
  applyLogContentsToApp,
  describeWithIndexedDBDisabled,
  renderApp,
  saveToIndexedDB,
  saveToLocalStorage,
  testCases,
  unmountApp
} from '../utils.js';

// Consolidate logic to run export and verify contents
async function expectAppToExport(expectedExportObj) {
  const getToolsControl = () =>
    findByRole(document.body, 'button', { name: 'Toggle Tools Menu' });
  const getExportMenuItem = () => findByText(document.body, 'Export All');
  expect(await getToolsControl()).toBeInTheDocument();
  userEvent.click(await getToolsControl());
  expect(await getExportMenuItem()).toBeInTheDocument();
  let exportedBlob;
  vi.spyOn(URL, 'createObjectURL').mockImplementationOnce((blob) => {
    exportedBlob = blob;
    // Doesn't matter what this value is
    return '';
  });
  userEvent.click(await getExportMenuItem());
  await waitFor(() => {
    expect(exportedBlob).toBeDefined();
  });
  expect(JSON.parse(await exportedBlob.text())).toEqual(expectedExportObj);
}

describe('export functionality', () => {
  afterEach(async () => {
    await unmountApp();
  });

  it('should export', async () => {
    await applyLogContentsToApp(
      // Build an object where the value is a log contents object and the key is
      // a relative date as an integer (representing how many dates from the
      // current date this log entry is)
      fromPairs(
        testCases.map((testCase, i, testCases) => {
          return [i - Math.floor(testCases.length / 2), testCase.logContents];
        })
      )
    );
    await renderApp();
    await expectAppToExport({
      logs: fromPairs(
        testCases.map((testCase, i, testCases) => {
          const daysDiff = i - Math.floor(testCases.length / 2);
          return [
            moment().add(daysDiff, 'days').format('l'),
            testCase.logContents
          ];
        })
      ),
      preferences: Preferences.getDefaultValueMap()
    });
  });

  it('should not export empty log entries', async () => {
    await applyLogContentsToApp({
      [-Math.floor(testCases.length / 2) - 1]: { ops: [{ insert: '\n' }] },
      ...fromPairs(
        testCases.map((testCase, i, testCases) => {
          return [i - Math.floor(testCases.length / 2), testCase.logContents];
        })
      )
    });
    await saveToIndexedDB('not_a_log_entry', '{}');
    await renderApp();
    await expectAppToExport({
      logs: fromPairs(
        testCases.map((testCase, i, testCases) => {
          const daysDiff = i - Math.floor(testCases.length / 2);
          return [
            moment().add(daysDiff, 'days').format('l'),
            testCase.logContents
          ];
        })
      ),
      preferences: Preferences.getDefaultValueMap()
    });
  });

  it('should not export entries which do not belong to app', async () => {
    await applyLogContentsToApp({
      ...fromPairs(
        testCases.map((testCase, i, testCases) => {
          return [i - Math.floor(testCases.length / 2), testCase.logContents];
        })
      )
    });
    await saveToIndexedDB('not_a_log_entry', 'foo');
    await renderApp();
    await expectAppToExport({
      logs: fromPairs(
        testCases.map((testCase, i, testCases) => {
          const daysDiff = i - Math.floor(testCases.length / 2);
          return [
            moment().add(daysDiff, 'days').format('l'),
            testCase.logContents
          ];
        })
      ),
      preferences: Preferences.getDefaultValueMap()
    });
  });

  describeWithIndexedDBDisabled('in localStorage-only mode', () => {
    it('should not export localStorage entries which do not belong to app', async () => {
      await applyLogContentsToApp(
        {
          ...fromPairs(
            testCases.map((testCase, i, testCases) => {
              return [
                i - Math.floor(testCases.length / 2),
                testCase.logContents
              ];
            })
          )
        },
        saveToLocalStorage
      );
      await saveToLocalStorage('not_a_log_entry', 'foo', { raw: true });
      await renderApp();
      await expectAppToExport({
        logs: fromPairs(
          testCases.map((testCase, i, testCases) => {
            const daysDiff = i - Math.floor(testCases.length / 2);
            return [
              moment().add(daysDiff, 'days').format('l'),
              testCase.logContents
            ];
          })
        ),
        preferences: Preferences.getDefaultValueMap()
      });
    });
  });
});
