import userEvent from '@testing-library/user-event';
import * as idbKeyval from 'idb-keyval';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import {
  applyLogContentsToApp,
  describeWithIndexedDBDisabled,
  getEditorElem,
  getStorageKeyFromDays,
  renderApp,
  unmountApp
} from '../utils.js';

describe('log editor', () => {
  beforeEach(async () => {
    vi.useFakeTimers({
      shouldAdvanceTime: true
    });
    await applyLogContentsToApp({
      '-3': realWorldTestCase1.logContents,
      '-2': basicLogTestCase.logContents,
      '-1': realWorldTestCase2.logContents
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await unmountApp();
  });

  it('should persist contents of editor to indexedDB by default', async () => {
    await renderApp();
    const editorElem = await getEditorElem();
    await userEvent.clear(editorElem);
    await userEvent.type(editorElem, 'foo');
    expect(await idbKeyval.get(getStorageKeyFromDays(0))).toEqual({
      ops: [
        {
          insert: '\nfoo\n'
        }
      ]
    });
  });

  describeWithIndexedDBDisabled('with localStorage-only mode', () => {
    it('should persist contents of editor to localStorage', async () => {
      await renderApp();
      const editorElem = await getEditorElem();
      await userEvent.clear(editorElem);
      await userEvent.type(editorElem, 'foo');
      expect(
        JSON.parse(localStorage.getItem(getStorageKeyFromDays(0)))
      ).toEqual({
        ops: [
          {
            insert: '\nfoo\n'
          }
        ]
      });
    });

    it('should remove entry when editor contents become empty', async () => {
      await renderApp();
      const editorElem = await getEditorElem();
      await userEvent.clear(editorElem);
      await userEvent.type(editorElem, 'foo');
      await userEvent.clear(editorElem);
      expect(localStorage.getItem(getStorageKeyFromDays(0))).toBeNull();
    });
  });
});
