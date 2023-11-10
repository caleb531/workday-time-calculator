import { findByTestId, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import basicLogTestCase from '../test-cases/basic.json';
import realWorldTestCase1 from '../test-cases/real-world-1.json';
import realWorldTestCase2 from '../test-cases/real-world-2.json';
import { applyLogContentsToApp, renderApp, unmountApp } from '../utils.js';

// Check if the given typed string (called the "completion query") will
// suggest the match represented by the given placeholder string, and also
// check if, on pressing the TAB key, if the app will apply the completion
async function checkIfCompletable(completionQuery, completionPlaceholder) {
  const editorElem = (
    await findByTestId(document.body, 'log-editor')
  ).querySelector('.ql-editor');
  const autocompleteElem = await findByTestId(
    document.body,
    'log-editor-autocomplete'
  );
  await userEvent.clear(editorElem);
  await userEvent.type(editorElem, completionQuery);
  await waitFor(() => {
    expect(autocompleteElem.textContent).toBe(completionPlaceholder);
  });
}

describe('log autocomplete', () => {
  beforeEach(async () => {
    await applyLogContentsToApp({
      '-3': realWorldTestCase1.logContents,
      '-2': basicLogTestCase.logContents,
      '-1': realWorldTestCase2.logContents
    });
  });

  afterEach(async () => {
    await unmountApp();
  });

  it('should suggest previously-entered word', async () => {
    await renderApp();
    await checkIfCompletable('Ge', 'tting');
  });

  it('should suggest previously-entered phrase', async () => {
    await renderApp();
    await checkIfCompletable('Getting sta', 'rted');
  });

  it('should not suggest anything if word is complete and there is no space following', async () => {
    await renderApp();
    await checkIfCompletable('Getting', '');
  });

  it('should suggest if there is a space following a complete word', async () => {
    await renderApp();
    await checkIfCompletable('Getting ', 'started');
  });

  it('should be case-sensitive', async () => {
    await renderApp();
    await checkIfCompletable('r', 'eview');
    await checkIfCompletable('R', 'esponding');
    await checkIfCompletable('w', 'ith');
    await checkIfCompletable('W', 'eekly');
  });
});
