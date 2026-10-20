import { findByRole, findByTestId, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import * as idbKeyval from 'idb-keyval';
import appStorage from '../../scripts/models/app-storage.js';
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
    // Finish queued redraws before replacing the clock used by Mithril
    await vi.advanceTimersByTimeAsync(20);
    vi.useRealTimers();
    await unmountApp();
  });

  it('should autofocus initially and keep the editor focused after day navigation', async () => {
    await renderApp();
    // Initial focus belongs to the editor once its first log has loaded
    const editor = await getEditorElem();
    await waitFor(() => expect(editor).toHaveFocus());
    // Loading a populated previous log must return focus to the editor
    const previous = await findByRole(document.body, 'button', {
      name: 'Go To Previous Day'
    });
    await userEvent.click(previous);
    await waitFor(() =>
      expect(editor).toHaveTextContent(
        realWorldTestCase2.assertions.categories[1].descriptions[0]
      )
    );
    expect(editor).toHaveFocus();
  });

  it('should skip initial autofocus if another control receives focus while loading', async () => {
    // Hold the initial daily log request while preferences load normally
    let finishLoading;
    // The deferred contents make the focus race deterministic
    const contents = new Promise((resolve) => {
      finishLoading = resolve;
    });
    // Other application storage reads retain their normal behavior
    const get = appStorage.get.bind(appStorage);
    vi.spyOn(appStorage, 'get').mockImplementation((key) =>
      key === getStorageKeyFromDays(0) ? contents : get(key)
    );
    await renderApp();
    // The user can reach the calendar toggle before the log finishes loading
    const toggle = await findByRole(document.body, 'button', {
      name: 'Toggle Calendar'
    });
    toggle.focus();
    finishLoading(basicLogTestCase.logContents);
    await waitFor(async () =>
      expect(await getEditorElem()).toHaveTextContent(
        basicLogTestCase.assertions.categories[0].descriptions[1]
      )
    );
    expect(toggle).toHaveFocus();
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

  // Typing into a suggestion should keep it visible until the user moves elsewhere
  it('should keep autocomplete while typing and dismiss it when the cursor moves', async () => {
    await renderApp();
    // Start with a word that has a suggestion in the saved logs
    const editorElem = await getEditorElem();
    await userEvent.clear(editorElem);
    await userEvent.type(editorElem, 'Ge');
    // Check the suggestion that the user sees before typing another character
    const suggestionElem = await findByTestId(
      document.body,
      'log-editor-has-autocomplete-active'
    );
    expect(suggestionElem).toHaveAttribute('data-autocomplete', 'tting');
    // Watch for new autocomplete requests while the existing suggestion is shortened
    const postMessage = vi.spyOn(Worker.prototype, 'postMessage');
    // Use the browser's selection so typing and cursor movement follow the real editor path
    const selection = window.getSelection();
    // Change the text and caret together, as a browser does when the user types
    const textNode = selection.anchorNode;
    textNode.appendData('t');
    selection.collapse(textNode, textNode.length);

    await waitFor(() => {
      expect(suggestionElem).toHaveAttribute('data-autocomplete', 'ting');
    });
    expect(postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ completionQuery: expect.any(String) })
    );

    // Moving back into the word should dismiss the suggestion without editing the text
    selection.collapse(textNode, 1);
    await waitFor(() => {
      expect(editorElem.querySelector('[data-autocomplete]')).toBeNull();
    });
    expect(editorElem).toHaveTextContent('Get');
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
